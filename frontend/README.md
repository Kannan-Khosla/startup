# Frontend - React Support Desk

Modern React frontend for the AI Support Ticketing System, built with Vite, React, and Tailwind CSS.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (Vite default port).

3. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory.

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Configuration

The frontend connects to the FastAPI backend. Configure the base URL in the UI sidebar, or it defaults to `http://localhost:8000`.

**Environment Variables:**
- Create `.env` file with `VITE_API_BASE_URL=http://localhost:8000` (optional)

## Features

✅ **Ticket Management**: Create, view, and filter tickets by status  
✅ **Message Threading**: View full conversation threads with auto-scroll  
✅ **Admin Actions**: Assign agents and close tickets (with token auth)  
✅ **Loading States**: Visual feedback during API calls  
✅ **Error Handling**: User-friendly error messages  
✅ **Modern UI**: Clean, responsive design with Tailwind CSS  
✅ **State Management**: React Context for global state  
✅ **Keyboard Shortcuts**: Enter to send messages  

## Project Structure

```
src/
├── components/        # React components
│   ├── Layout.jsx    # Main app layout
│   ├── TicketList.jsx # Sidebar with ticket list
│   ├── TicketThread.jsx # Chat thread view
│   ├── MessageBubble.jsx # Individual message
│   ├── NewTicketForm.jsx # Create ticket form
│   ├── AdminPanel.jsx # Admin actions
│   └── Loading.jsx   # Loading spinner
├── contexts/         # React Context for state management
│   └── AppContext.jsx # Global app state
├── services/         # API service layer
│   └── api.js        # All API endpoints
└── index.css         # Tailwind CSS and global styles
```

## Components

- **Layout**: Main two-column layout (sidebar + main content)
- **TicketList**: Sidebar showing all tickets with filtering
- **TicketThread**: Main chat view with messages and reply input
- **MessageBubble**: Individual message display (customer/AI)
- **NewTicketForm**: Form to create or continue tickets
- **AdminPanel**: Admin actions (assign agent, close ticket)
- **Loading**: Reusable loading spinner

## Development

The app runs on `http://localhost:5173` by default (Vite default port). Make sure the backend API is running on `http://localhost:8000` (or configure a different URL in the UI sidebar).

**Tech Stack:**
- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 4.1.16
- React Context API for state management
