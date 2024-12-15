# Realtime Web App

## Overview
This repository contains the backend code for a realtime web application built using **Nodejs**. The application allows users to manage a collection of items with all the features mentioned in the challenge:

## Extra Features added apart from orignal challenge

1. **Drag and Drop**
   - Items and folders can be reordered via drag-and-drop functionality.
   - Items and folders can be moved between folders or out to the main page.

2. **Highly Scalable**
   - Uses Pub-Sub architecutre on the backend.


---

## Tech Stack

- **Backend:** Node.js, Redis (Pub-Sub) 
- **Frontend:** React, TypeScript
- **Real-Time Communication:** WebSocket
- **Database:** Postgres 
- **Styling:** Tailwind CSS, ShadCN components

---

## Setup Instructions

Follow these steps to set up and run the frontend application locally:

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) 
- [npm](https://www.npmjs.com/) 

### Steps

1. **Clone the Repository**

2. **Install Dependencies**

   Use npm to install all required packages:

   ```bash
   npm install
   ```

    Ensure you have redis running on default port (6479)
    Ensure to create postgres db and have it defined on .env


3. **Start the Development Server**

   Start the app in development mode:

   ```bash
   npm run dev 5000
   ```

---

## Usage

- Use the app interface to add, group, reorder, and manage items.
- Changes will persist and synchronize across sessions in real time.

---