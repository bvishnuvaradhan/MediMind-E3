# Methodology: Multi-Cohort, Calibrated, and Explainable Diabetes Risk Architecture

**Module:** MediMind Type-2 Diabetes Prediction System  
**Date:** November 2026  
**Auditor:** Senior Machine Learning & Clinical AI Research Engineer  

---

## 1. Architectural Philosophy

Clinical risk prediction requires an engineering approach fundamentally different from consumer tabular modeling. The objective is not to maximize an uncalibrated test accuracy metric through complex black-box modeling, but to provide **calibrated, stable, explainable, and clinically actionable risk probabilities that generalize across diverse patient populations**.

Our methodology integrates five core components:
1. **Multi-Cohort Feature Harmonization:** Mapping diverse clinical and epidemiological schemas to a shared physiological core ($\mathcal{X}_{\text{core}}$).
2. **Leakage-Free Preprocessing:** Partition-strict calculation of scaling, imputation, and physiological bounds clipping.
3. **Calibrated Multi-Model Ensemble:** Soft-voting combination of modern histogram-based gradient boosting (LightGBM-style), deep regularized multi-layer perceptrons, and random forests, wrapped in a validation-fitted Platt scaling layer.
4. **Clinical Decision Curve Optimization:** Setting cost-sensitive operating thresholds that maximize Net Clinical Benefit over default clinical screening policies.
5. **Two-Tier Explainability:** Population-level permutation feature importance combined with patient-level physiological deviation vectors.

---

## 2. Mathematical Formalization

Let a patient record be represented by a feature vector $x \in \mathbb{R}^d$, where $x$ contains clinical, physiological, and demographic measurements. The true outcome is $y \in \{0, 1\}$, indicating presence of Type-2 Diabetes.

### 2.1 Model Ensemble Formulation
The base risk engine combines three heterogeneous inductive biases:
* $f_1(x)$: **Histogram Gradient Boosted Decision Tree (HGB)** — captures non-linear feature interactions and step-function thresholds.
* $f_2(x)$: **Deep Regularized MLP** with hidden layers $(64, 32, 16)$, $L_2$ penalty $\alpha = 0.01$, and batch standardization — captures smooth manifold transformations.
* $f_3(x)$: **Random Forest (RF)** with 300 estimators and restricted tree depth ($\text{max\_depth} = 8$) — minimizes variance and handles noisy measurements.

The uncalibrated ensemble risk probability is given by soft voting:
$$\bar{p}(x) = \frac{1}{3} \sum_{k=1}^3 f_k(x)$$

### 2.2 Post-Hoc Probability Calibration (Platt Scaling)
To transform raw ensemble probabilities into true posterior probabilities reflecting empirical event rates, we fit a logistic calibration mapping on the hold-out validation partition $\mathcal{D}_{\text{val}} = \{(x_i, y_i)\}_{i=1}^{N_{\text{val}}}$:

$$z_i = \text{logit}(\bar{p}(x_i)) = \ln\left(\frac{\bar{p}(x_i)}{1 - \bar{p}(x_i)}\right)$$
$$p_{\text{cal}}(x) = \sigma(a \cdot z_i + b) = \frac{1}{1 + \exp(-(a \cdot z_i + b))}$$

The scalar parameters $a, b \in \mathbb{R}$ are estimated by minimizing the cross-entropy loss over validation data only, ensuring zero test leakage:
$$\min_{a, b} -\sum_{i \in \mathcal{D}_{\text{val}}} \left[ y_i \ln p_{\text{cal}}(x_i) + (1 - y_i) \ln(1 - p_{\text{cal}}(x_i)) \right]$$

### 2.3 Expected Calibration Error (ECE)
Calibration quality is evaluated by partitioning predictions into $M = 10$ equally spaced confidence bins $B_m \subset [0, 1]$:
$$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
where:
$$\text{acc}(B_m) = \frac{1}{|B_m|} \sum_{i \in B_m} y_i, \quad \text{conf}(B_m) = \frac{1}{|B_m|} \sum_{i \in B_m} p_{\text{cal}}(x_i)$$

### 2.4 Decision Curve Analysis (DCA) and Net Benefit
Following Vickers & Elkin (2006), clinical utility is measured by Net Benefit ($\text{NB}$) across candidate decision thresholds $p_t$:
$$\text{NB}(p_t) = \frac{\text{TP}}{N} - \frac{\text{FP}}{N} \left(\frac{p_t}{1 - p_t}\right)$$

This metric directly incorporates the relative clinical cost of a false positive vs. a false negative: a clinician choosing threshold $p_t$ implies that a false negative is $(1 - p_t) / p_t$ times more harmful than a false positive.

The number of avoidable screening interventions per 100 patients compared to a default "screen all" strategy is computed as:
$$\text{Avoidable Interventions} = \frac{\text{NB}_{\text{model}}(p_t) - \text{NB}_{\text{all}}(p_t)}{p_t / (1 - p_t)} \times 100$$
