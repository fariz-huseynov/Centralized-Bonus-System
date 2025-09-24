# Centralized Bonus System

The Centralized Bonus System is a modern, AI-powered web application for managing employee data, bonuses, and performance. It features a sophisticated, ultra-realistic iOS-inspired UI, secure face verification, detailed analytics dashboards, and an interactive user experience.

<img width="2696" height="1525" alt="image" src="https://github.com/user-attachments/assets/721f96fd-774f-4e8a-82a2-08042c3fbc78" />


## ✨ Key Features

-   **Elegant Employee Management**: Add, view, edit, and delete employee profiles through a clean, intuitive interface.
-   **AI-Powered Efficiency**:
    -   **AI Auto-fill**: Instantly populate new employee forms with realistic data using the Google Gemini API.
    -   **AI Background Replacement**: Automatically replace the background of employee portraits with a clean, professional white background.
-   **Secure Face Login**: A high-fidelity, native-style Face ID screen allows for secure, password-less verification using webcam-based facial recognition.
-   **Advanced Analytics & Visualizations**:
    -   **Luxury Summary Chart**: A beautiful radial bar chart provides a visual breakdown of an employee's tasks.
    -   **Luxury Leaderboard**: A dynamic, animated bar race chart ranks top performers, complete with employee avatars and medal indicators.
-   **Detailed Audit Logging**: Track and view a detailed timeline of actions (e.g., 'Item Picked', 'BDC Scanned') for each employee.
-   **Interactive Walkthrough**: A guided tour for first-time users that highlights key features and functionality.
-   **Ultra-Realistic iOS UI**: Meticulously designed to replicate the look, feel, and fluid motion of a native iOS application, from bottom-sheet modals to frosted glass effects.

## 🚀 Technology Stack

-   **Frontend**: React 18
-   **Styling**: Tailwind CSS for a utility-first styling approach, customized for an iOS look and feel.
-   **AI & Machine Learning**:
    -   **Google Gemini API (`@google/genai`)**: Powers the AI Auto-fill and Background Replacement features.
    -   **face-api.js**: A client-side library for face detection and recognition, used for generating embeddings and powering the Face Login feature.
-   **Charts & Visualizations**: Recharts, customized to create "ultra-luxury" chart components.
-   **State Management**: React Context API for global state management.

## ⚙️ Getting Started

This is a client-side web application that runs entirely in the browser. No complex installation or build process is required.

### Prerequisites

1.  A modern web browser (Chrome, Firefox, Safari, Edge).
2.  An active internet connection.
3.  A webcam (for photo capture and face login).

### Configuration

The application's AI features are powered by the Google Gemini API and require an API key.

1.  **Obtain an API Key**: Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Set Up Environment Variable**: The application is configured to read the API key from a `process.env.API_KEY` variable. You will need to make this variable available to your browser environment. For local development, one common method is to use a tool like Vite or Create React App that supports `.env` files. Create a file named `.env.local` in the project root and add your key:

    ```
    API_KEY="YOUR_GEMINI_API_KEY"
    ```

    **Note**: If you are deploying this to a hosting provider, you will need to set this environment variable through their dashboard or configuration settings. **Without a valid API key, the AI Auto-fill and AI Background buttons will be disabled.**

## 📖 Usage Guide

### First-Time Use

On your first visit, an interactive walkthrough will automatically start to guide you through the main features of the application. You can restart this tour at any time by clicking the **Help** (?) icon in the header.

### Managing Employees

-   **Add an Employee**: Click the **Add Employee** button on the dashboard. The employee form will slide up in a native iOS-style bottom sheet.
-   **AI Auto-fill**: Inside the form, click the **AI Auto-fill** button to let the Gemini API generate and fill in the employee's name, bonus number, payroll number, and work areas.
-   **Capture a Photo**: Use the integrated webcam to capture a portrait. The application will automatically attempt to detect a face to generate a facial embedding for login.
    -   If a face is not detected, you will be warned, but you can still save the employee. They will not be able to use the Face Login feature.
-   **AI Background**: After capturing a photo, click the **AI Background** button to replace the original background with a clean, solid white one.
-   **Edit/Delete**: Use the `edit` and `delete` icons on an employee's card on the dashboard. Deleting an employee will prompt a native-style confirmation dialog.

### Viewing Details and Analytics

-   Click the **View** icon on any employee card to navigate to their details page.
-   Use the segmented control at the top to switch between:
    -   **Audit Log**: A chronological timeline of the employee's logged actions.
    -   **Summary Charts**: A luxury radial chart visualizing the employee's task breakdown.
    -   **Leaderboard**: A performance ranking of all employees.
-   **Generate Random Logs**: On the details page, click the **Generate Logs** button to add 5 random audit entries for the selected employee for demonstration purposes.

### Face Login

1.  Click the **Face Login** button in the main header.
2.  Grant the browser permission to use your webcam if prompted.
3.  Position your face within the circular frame on the screen.
4.  The system will automatically detect your face, generate an embedding, and compare it against the stored embeddings of all registered employees.
5.  If a match is found, you will be successfully logged in and redirected to that employee's details page. If no match is found, a "Face not recognized" message will appear.

## 🔧 Troubleshooting

-   **Webcam Not Working**:
    -   Ensure you have granted your browser permission to access the camera.
    -   Check that no other application is currently using your webcam.
-   **AI Features Are Disabled**:
    -   This occurs when the Gemini API key is missing or invalid. Please see the **Configuration** section to set up your `API_KEY` environment variable.
-   **Face Not Recognized During Login**:
    -   Ensure your face is well-lit and clearly visible in the camera frame.
    -   Verify that a face was successfully detected when the employee's photo was originally captured.
-   **"Failed to fetch" or "Error loading face-api models"**:
    -   These errors indicate a problem connecting to the Content Delivery Network (CDN) that hosts the face recognition models. Check your internet connection. If the problem persists, the CDN may be temporarily unavailable.
