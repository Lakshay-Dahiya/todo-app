# Todo App

A beautiful, full-stack todo application built with vanilla JavaScript, HTML, CSS, and Node.js.

## Features

- ✨ Beautiful, responsive design without frameworks
- 📱 Mobile-friendly interface
- 🚀 Fast and lightweight
- 💾 Persistent data storage with SQLite
- 🔄 Real-time updates
- 📊 Task statistics and filtering
- ⚡ Modern ES6+ JavaScript

## Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styles with animations and responsive design
- **JavaScript (ES6+)**: Vanilla JS with modern features

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **SQLite3**: Database
- **CORS**: Cross-origin resource sharing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-app
```

2. Install dependencies:
```bash
npm install
```

3. Create the data directory:
```bash
mkdir data
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit:
```
http://localhost:3000
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm test` - Run tests (to be implemented)

## API Endpoints

### GET /api/todos
Get all todos

### POST /api/todos
Create a new todo
```json
{
  "text": "Todo text"
}
```

### PUT /api/todos/:id
Update a todo
```json
{
  "text": "Updated text",
  "completed": true
}
```

### DELETE /api/todos/:id
Delete a specific todo

### DELETE /api/todos
Delete all completed todos

### GET /api/health
Health check endpoint

## Project Structure

```
todo-app/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styles
│   └── script.js       # Frontend JavaScript
├── server/
│   └── server.js       # Express server
├── data/
│   └── todos.db        # SQLite database (created automatically)
├── .env                # Environment variables
├── package.json        # Project dependencies
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- [ ] User authentication
- [ ] Todo categories/tags
- [ ] Due dates and reminders
- [ ] Drag and drop reordering
- [ ] Dark mode toggle
- [ ] Export/import functionality
- [ ] Progressive Web App (PWA) features
- [ ] Real-time collaboration