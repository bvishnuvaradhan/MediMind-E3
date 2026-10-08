"""Dataset documentation for the Pima Indians Diabetes Database.

Dataset: Pima Indians Diabetes Database
Source:  National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)
         Originally curated by UCI Machine Learning Repository.
         Commonly distributed via Kaggle:
         https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database

License / Usage:
  The dataset is widely used for academic and research purposes.
  It was originally collected by the NIDDK for epidemiological research.
  Users are responsible for verifying the applicable license for their use case
  before use in production or commercial systems.

Records:       768 (after loading; biological-zero imputation applied before training)
Features:      8 numeric input features
Target column: Outcome (0 = no diabetes, 1 = diabetes)
Class balance: 500 negative (65.1 %), 268 positive (34.9 %) — imbalanced

Features (fixed order, locked to this dataset):
  Pregnancies          : Number of times pregnant (integer, 0–17)
  Glucose              : Plasma glucose concentration (mg/dL, 2-hour oral glucose test)
  BloodPressure        : Diastolic blood pressure (mm Hg)
  SkinThickness        : Triceps skinfold thickness (mm)
  Insulin              : 2-hour serum insulin (mu U/ml)
  BMI                  : Body mass index (weight in kg / height in m^2)
  DiabetesPedigreeFunction : Diabetes pedigree function (genetic risk score)
  Age                  : Age in years

Biological zero handling:
  Glucose, BloodPressure, SkinThickness, Insulin, and BMI cannot
  physiologically be zero. Zero values in these columns are treated as
  missing values and replaced with the column median computed on non-zero
  rows of the training set only (to avoid data leakage).

Train / Validation / Test split:
  Stratified 70 / 15 / 15 split (random_state=42).
  Class balance is preserved across all three partitions.

Preprocessing applied:
  1. Biological-zero imputation (median on non-zero training values).
  2. StandardScaler (fitted on training set only) applied in pipelines for
     Logistic Regression and MLP.
  3. Random Forest receives the imputed-but-unscaled features directly.

Known limitations:
  - The cohort is exclusively Pima Indian women aged 21 or older.
    Results may not generalise to other populations.
  - Class imbalance (≈35% positive) should be considered when interpreting
    precision and recall.
  - Feature quality: SkinThickness and Insulin have a high proportion of
    biological zeros (biologically invalid) that are imputed.
  - This dataset is a research benchmark, not a clinical validation dataset.
  - External validation on a broader population is required before any
    clinical deployment.
  - Model output is an estimated diabetes risk probability, not a diagnosis.
