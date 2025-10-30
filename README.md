# 📝 Full-Stack Todo App

A beautiful, feature-rich todo application built with vanilla JavaScript, Node.js, and SQLite. No frameworks, just clean code and modern design.

## ✨ Features

### Core Functionality
- ✅ **Add, Edit, Delete** todos with rich text support
- 🎯 **Priority Levels** - High, Medium, Low with color coding
- 📁 **Categories** - Organize todos by category
- 📅 **Due Dates** - Set deadlines with overdue indicators
- ✔️ **Completion Tracking** - Mark todos as complete/incomplete

### Advanced Features
- 🔍 **Search & Filter** - Real-time search with multiple filter options
- 🎨 **Dark/Light Mode** - Beautiful themes with smooth transitions
- 🔄 **Drag & Drop** - Reorder todos with visual feedback
- 📦 **Bulk Operations** - Select multiple todos for batch actions
- 📊 **Export/Import** - JSON and CSV support for data portability
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and actions

### UI/UX Excellence
- 🎯 **Responsive Design** - Optimized for desktop and mobile
- ✨ **Glass Morphism** - Modern translucent design elements
- 🌈 **Smooth Animations** - Buttery-smooth transitions and effects
- 🎨 **Beautiful Typography** - Inter font family for premium feel
- 🌙 **Enhanced Dark Mode** - Stunning dark theme with cyan accents

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
todo-app/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── script.js          # Frontend JavaScript
│   └── styles.css         # Enhanced CSS with themes
├── server/                # Backend files
│   └── server.js          # Express server with SQLite
├── data/                  # Database directory
│   └── todos.db          # SQLite database (auto-created)
├── package.json          # Dependencies and scripts
└── README.md             # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - ES6+ features, no frameworks
- **Inter Font** - Premium Google Font

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight database
- **CORS** - Cross-origin resource sharing

### Features Implementation
- **RESTful API** - Clean API design
- **Glass Morphism** - Modern UI with backdrop-blur
- **Drag & Drop API** - Native HTML5 drag and drop
- **Local Storage** - Theme persistence
- **File API** - Import/Export functionality

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Add new todo |
| `Ctrl + /` | Focus search |
| `Ctrl + E` | Export todos |
| `Ctrl + I` | Import todos |
| `Ctrl + A` | Select all todos |
| `Delete` | Delete selected |
| `Escape` | Clear search/selection |
| `?` | Show help modal |

## 🎨 Themes

### Light Mode
- Clean, minimal design with soft gradients
- High contrast for excellent readability
- Subtle shadows and modern border radius

### Dark Mode
- Deep space-inspired background
- Cyan accent colors (#4facfe → #00f2fe)
- Glass morphism effects with backdrop blur
- Enhanced visual hierarchy

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | Get all todos |
| `POST` | `/api/todos` | Create new todo |
| `PUT` | `/api/todos/:id` | Update todo |
| `DELETE` | `/api/todos/:id` | Delete todo |
| `PUT` | `/api/todos/bulk` | Bulk operations |
| `GET` | `/api/health` | Server health check |

## 🚀 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run tests (if configured)
```

### Database Schema

```sql
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT '',
    due_date DATE,
    order_index INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Roadmap

- [ ] User authentication
- [ ] Real-time sync across devices
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] PWA support
- [ ] Advanced analytics dashboard

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by productivity apps like Todoist and Any.do
- Uses Inter font family by Rasmus Andersson
- Glass morphism design trends

---

Made with ❤️ by [Your Name]