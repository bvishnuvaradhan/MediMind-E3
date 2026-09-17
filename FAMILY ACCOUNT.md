# MediMind Family Account Frontend

## Purpose

This document describes only the functionality currently implemented in the React frontend prototype.

## Dashboard

The dashboard includes:

- Family member profile cards
- Active member selection
- Next appointment mock card
- Latest AI insight mock card
- Recent medical records
- Family account summary
- Secure access banner
- Navigation to appointments, records, uploads, and AI predictions

The sidebar remains fixed while the main page scrolls.

## Family Members

The Family Members page supports:

- Add a family member
- Enter a member name
- Select a relation
- Select Other and enter a custom relation
- View a member on a separate profile page
- Delete a member with confirmation
- Prevent deleting the final remaining member
- Switch between family profiles

New members receive mock record and prediction counts of zero.

## Member Profile

Each family member can be opened on a separate profile page containing:

- Member name and relation
- Health overview mock score
- Medical record count
- AI prediction count
- Recent records
- Link to the Medical records page
- Back to Family members navigation

## Medical Records

The Medical records page includes mock records with:

- Record type
- Date
- Source
- Availability status
- Record category filters
- Click feedback for opening a record

The Upload record page includes controls for:

- Patient profile
- Record type
- PDF or image upload
- Description
- Save record feedback

## AI Predictions

The AI Predictions page includes presentation modules for:

- Fracture detection
- Diabetes risk
- Heart disease risk
- General health risk

The General health risk model represents an overall estimate based on symptoms, lifestyle, family history, and recent records.

All prediction modules currently use mock presentation behavior and do not connect to a production AI model.

## Doctors

The Doctors page includes mock doctor profiles with:

- Doctor name
- Department
- Clinic
- Availability information
- Book appointment action
- View profile action

Book appointment opens the AI-assisted appointment intake flow. View profile opens a separate doctor profile page.

## AI-Assisted Appointment Intake

Before booking an appointment, the user can:

- Enter symptoms or concerns
- Upload a PDF or image report
- Run a mock AI assessment
- Receive a Routine priority or High priority result
- Carry the assessment summary into Appointment details

High-priority symptoms recommend the earliest available appointment slot. This is decision support only and is not a medical diagnosis.

## Appointment Booking

The booking page supports:

- Patient profile selection
- Assigned doctor selection
- Appointment date
- Doctor-specific time slots
- Appointment type
- Consultation mode
- Reason for the appointment
- AI-generated reason summary
- Appointment confirmation
- Back and Cancel actions

Booked slots are tracked by doctor and date. A booked slot is disabled and cannot be booked again. Confirmed appointments are displayed on the Appointments page.

## Appointments

The Appointments page includes:

- Mock appointment cards
- Newly booked appointment cards
- Doctor and patient details
- Date and time
- Consultation mode
- View details action
- Top-right Book appointment action

View details opens a popup with appointment information and preparation guidance.

## Consultations

The Consultations page includes mock consultation cards with:

- Doctor and patient details
- Updated date
- Treatment-plan status
- Open notes action

Open notes displays consultation details in a popup.

## Prescriptions

The Prescriptions page includes mock prescription cards with:

- Prescription name
- Patient
- Usage summary
- Active-until date
- View instructions action

View instructions opens a popup with prescription guidance. The popup includes a Download prescription action that generates a text prescription file from the displayed mock data.

## Help Center

The Help center page includes:

- Frequently asked questions
- Read answer actions
- Contact support action
- Secure support message

## Settings

The Settings page includes:

- Light and dark mode control
- Notification preference action
- Privacy and security action

The notification bell and notification popover were removed from the application header.

## Navigation Removed

The following features are not included in the current frontend navigation:

- MediMind Knowledge
- Doctor access
- Notification bell and notification popover

## Frontend Limitations

The application currently uses React state and mock data. It does not yet persist data to a backend database.

Refreshing the browser resets:

- Added family members
- Booked appointments
- Booked time slots
- AI assessment results
- Modal and form state

Uploaded files are used for mock assessment input only and are not stored.
