class TodoApp {
    constructor() {
        this.todos = [];
        this.selectedTodos = new Set();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.apiUrl = 'http://localhost:3000/api';
        this.draggedElement = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.loadTodos();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.categoryInput = document.getElementById('categoryInput');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.activeCount = document.getElementById('activeCount');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.themeToggle = document.getElementById('themeToggle');
        this.exportBtn = document.getElementById('exportBtn');
        this.importInput = document.getElementById('importInput');
        this.toastContainer = document.getElementById('toastContainer');
        this.shortcutsModal = document.getElementById('shortcutsModal');
        this.closeShortcuts = document.getElementById('closeShortcuts');
        this.helpBtn = document.getElementById('helpBtn');
        
        // Bulk operations
        this.bulkActions = document.getElementById('bulkActions');
        this.selectedCount = document.getElementById('selectedCount');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.bulkCompleteBtn = document.getElementById('bulkCompleteBtn');
        this.bulkUncompleteBtn = document.getElementById('bulkUncompleteBtn');
        this.bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

        // Check if critical elements exist
        if (!this.todoForm || !this.todoInput || !this.todoList) {
            console.error('Critical elements not found:', {
                todoForm: !!this.todoForm,
                todoInput: !!this.todoInput,
                todoList: !!this.todoList
            });
        }
    }

    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.exportBtn.addEventListener('click', () => this.exportTodos());
        this.importInput.addEventListener('change', (e) => this.importTodos(e));
        this.closeShortcuts.addEventListener('click', () => this.hideShortcutsModal());
        this.helpBtn.addEventListener('click', () => this.showShortcutsModal());
        
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.searchClear.addEventListener('click', () => this.clearSearch());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Bulk operations
        this.selectAllBtn.addEventListener('click', () => this.selectAllTodos());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllTodos());
        this.bulkCompleteBtn.addEventListener('click', () => this.bulkOperation('complete'));
        this.bulkUncompleteBtn.addEventListener('click', () => this.bulkOperation('uncomplete'));
        this.bulkDeleteBtn.addEventListener('click', () => this.bulkOperation('delete'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Close modal when clicking overlay
        this.shortcutsModal.addEventListener('click', (e) => {
            if (e.target === this.shortcutsModal) {
                this.hideShortcutsModal();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    handleSearch(e) {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTodos();
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.renderTodos();
    }

    handleKeyboard(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            // Only allow specific shortcuts in inputs
            if (e.key === 'Escape' && e.target === this.searchInput) {
                this.clearSearch();
            }
            return;
        }

        // Ctrl/Cmd + N for new todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.todoInput.focus();
            this.showToast('Focus on new todo input', '', 'info');
        }
        
        // Ctrl/Cmd + / for search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.searchInput.focus();
            this.showToast('Focus on search', '', 'info');
        }

        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportTodos();
        }

        // Ctrl/Cmd + I for import
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            this.importInput.click();
        }

        // Ctrl/Cmd + A for select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAllTodos();
        }

        // Delete key for bulk delete
        if (e.key === 'Delete' && this.selectedTodos.size > 0) {
            e.preventDefault();
            this.bulkOperation('delete');
        }

        // ? for help
        if (e.key === '?' && !e.shiftKey) {
            e.preventDefault();
            this.showShortcutsModal();
        }

        // Escape to clear search or close modals
        if (e.key === 'Escape') {
            this.hideShortcutsModal();
            if (this.selectedTodos.size > 0) {
                this.deselectAllTodos();
            }
        }
    }

    async showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    async hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    async apiRequest(url, options = {}) {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiUrl}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showError('Failed to connect to server. Please try again.');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async loadTodos() {
        try {
            const response = await this.apiRequest('/todos');
            this.todos = response.data || [];
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }

    async handleAddTodo(e) {
        e.preventDefault();
        
        const text = this.todoInput.value.trim();
        const priority = this.prioritySelect.value;
        const category = this.categoryInput.value.trim();
        const dueDate = this.dueDateInput.value || null;
        
        if (!text) {
            this.showToast('Invalid Input', 'Please enter a todo text', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/todos', {
                method: 'POST',
                body: JSON.stringify({ text, priority, category, dueDate })
            });

            const newTodo = response.data;
            this.todos.unshift(newTodo);
            this.todoInput.value = '';
            this.categoryInput.value = '';
            this.dueDateInput.value = '';
            this.prioritySelect.value = 'medium';
            this.renderTodos();
            this.updateStats();
            this.showToast('Todo Added', `"${text}" added successfully`, 'success', 3000);
        } catch (error) {
            console.error('Failed to add todo:', error);
            this.showToast('Failed to Add', 'Could not add todo. Please try again.', 'error');
        }
    }

    async toggleTodo(id) {
        try {
            const todo = this.todos.find(t => t.id === id);
            if (!todo) return;

            const response = await this.apiRequest(`/todos/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    text: todo.text,
                    priority: todo.priority,
                    category: todo.category,
                    dueDate: todo.dueDate,
                    completed: !todo.completed 
                })
            });

            const updatedTodo = response.data;
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.renderTodos();
            this.updateStats();
            
            const action = updatedTodo.completed ? 'completed' : 'reactivated';
            this.showToast('Todo Updated', `"${todo.text}" ${action}`, 'success', 2000);
        } catch (error) {
            console.error('Failed to toggle todo:', error);
            this.showToast('Update Failed', 'Could not update todo status', 'error');
        }
    }

    async editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        // Create a simple edit form (could be enhanced with a modal)
        const newText = prompt('Edit todo text:', todo.text);
        if (!newText || newText.trim() === todo.text) return;

        const newCategory = prompt('Edit category (leave empty for none):', todo.category || '');
        const newDueDate = prompt('Edit due date (YYYY-MM-DD format, leave empty for none):', todo.dueDate || '');
        const newPriority = prompt('Edit priority (low/medium/high):', todo.priority);

        if (!['low', 'medium', 'high'].includes(newPriority)) {
            this.showToast('Invalid Priority', 'Priority must be low, medium, or high', 'error');
            return;
        }

        try {
            const response = await this.apiRequest(`/todos/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    text: newText.trim(),
                    category: newCategory.trim(),
                    dueDate: newDueDate || null,
                    priority: newPriority,
                    completed: todo.completed 
                })
            });

            const updatedTodo = response.data;
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.renderTodos();
            this.showToast('Todo Updated', `Todo edited successfully`, 'success', 2000);
        } catch (error) {
            console.error('Failed to edit todo:', error);
            this.showToast('Edit Failed', 'Could not update todo', 'error');
        }
    }

    async deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        if (!confirm('Are you sure you want to delete this todo?')) return;

        try {
            // Optimistically remove from UI
            const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
            if (todoElement) {
                todoElement.classList.add('removing');
                setTimeout(() => {
                    this.todos = this.todos.filter(t => t.id !== id);
                    this.renderTodos();
                    this.updateStats();
                }, 300);
            }

            await this.apiRequest(`/todos/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('Todo Deleted', `"${todo.text}" was deleted`, 'success', 3000);
        } catch (error) {
            console.error('Failed to delete todo:', error);
            this.showToast('Delete Failed', 'Could not delete todo. Please try again.', 'error');
            // Reload todos to restore state on error
            this.loadTodos();
        }
    }

    async clearCompletedTodos() {
        const completedTodos = this.todos.filter(t => t.completed);
        if (completedTodos.length === 0) return;

        if (!confirm(`Delete ${completedTodos.length} completed todo(s)?`)) return;

        try {
            await Promise.all(
                completedTodos.map(todo => 
                    this.apiRequest(`/todos/${todo.id}`, { method: 'DELETE' })
                )
            );

            this.todos = this.todos.filter(t => !t.completed);
            this.renderTodos();
            this.updateStats();
            this.showToast('Completed Cleared', `${completedTodos.length} completed todos deleted`, 'success');
        } catch (error) {
            console.error('Failed to clear completed todos:', error);
            this.showToast('Clear Failed', 'Could not clear completed todos', 'error');
            this.loadTodos(); // Reload on error
        }
    }

    handleFilterChange(e) {
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTodos();
    }

    getFilteredTodos() {
        let filteredTodos = this.todos;

        // Apply search filter
        if (this.searchQuery) {
            filteredTodos = filteredTodos.filter(todo =>
                todo.text.toLowerCase().includes(this.searchQuery) ||
                (todo.category && todo.category.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply status/priority/date filter
        switch (this.currentFilter) {
            case 'active':
                return filteredTodos.filter(t => !t.completed);
            case 'completed':
                return filteredTodos.filter(t => t.completed);
            case 'high':
                return filteredTodos.filter(t => t.priority === 'high');
            case 'medium':
                return filteredTodos.filter(t => t.priority === 'medium');
            case 'low':
                return filteredTodos.filter(t => t.priority === 'low');
            case 'overdue':
                return filteredTodos.filter(t => t.dueDate && this.isOverdue(t.dueDate));
            case 'today':
                return filteredTodos.filter(t => t.dueDate && this.isDueToday(t.dueDate));
            default:
                return filteredTodos;
        }
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');
        
        // Sort by order index, then priority and completion status
        const sortedTodos = filteredTodos.sort((a, b) => {
            // Completed todos go to bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Sort by order index first
            if (a.orderIndex !== b.orderIndex) {
                return a.orderIndex - b.orderIndex;
            }
            
            // Then by priority (high > medium > low)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        this.todoList.innerHTML = sortedTodos.map(todo => {
            const dueDate = this.formatDate(todo.dueDate);
            const isSelected = this.selectedTodos.has(todo.id);
            
            return `
                <li class="todo-item ${todo.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                    data-todo-id="${todo.id}" 
                    data-priority="${todo.priority}"
                    draggable="true">
                    <div class="todo-select-checkbox ${isSelected ? 'checked' : ''}" 
                         onclick="app.toggleTodoSelection(${todo.id})"></div>
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                         onclick="app.toggleTodo(${todo.id})"></div>
                    <div class="todo-content">
                        <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                        <div class="todo-meta">
                            ${todo.category ? `<span class="todo-category">🏷️ ${this.escapeHtml(todo.category)}</span>` : ''}
                            ${dueDate ? `<span class="todo-due-date ${dueDate.class}">${dueDate.text}</span>` : ''}
                            <span class="priority-badge ${todo.priority}">
                                ${this.getPriorityIcon(todo.priority)} ${todo.priority}
                            </span>
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="edit-btn" onclick="app.editTodo(${todo.id})">Edit</button>
                        <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">Delete</button>
                    </div>
                </li>
            `;
        }).join('');

        // Add drag and drop event listeners
        this.addDragAndDropListeners();
    }

    getPriorityIcon(priority) {
        switch (priority) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    }

    updateStats() {
        const activeCount = this.todos.filter(t => !t.completed).length;
        const completedCount = this.todos.filter(t => t.completed).length;
        
        this.activeCount.textContent = activeCount;
        this.clearCompleted.disabled = completedCount === 0;
        this.clearCompleted.textContent = `Clear completed (${completedCount})`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.showToast('Error', message, 'error');
    }

    // Toast Notification System
    showToast(title, message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
            <div class="toast-progress"></div>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove after duration
        const timer = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timer);
            this.removeToast(toast);
        });

        return toast;
    }

    removeToast(toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Export/Import Functionality
    exportTodos() {
        try {
            const exportData = {
                todos: this.todos,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            this.showToast('Export Successful', `Exported ${this.todos.length} todos`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Export Failed', 'Could not export todos', 'error');
        }
    }

    async importTodos(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await this.readFile(file);
            let importData;

            if (file.name.endsWith('.json')) {
                importData = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                importData = this.parseCSV(text);
            } else {
                throw new Error('Unsupported file format');
            }

            const todos = importData.todos || importData;
            if (!Array.isArray(todos)) {
                throw new Error('Invalid file format');
            }

            // Validate and import todos
            let importedCount = 0;
            for (const todo of todos) {
                if (todo.text && typeof todo.text === 'string') {
                    try {
                        const response = await this.apiRequest('/todos', {
                            method: 'POST',
                            body: JSON.stringify({
                                text: todo.text,
                                priority: todo.priority || 'medium'
                            })
                        });
                        importedCount++;
                    } catch (error) {
                        console.error('Failed to import todo:', todo.text, error);
                    }
                }
            }

            await this.loadTodos();
            this.showToast('Import Successful', `Imported ${importedCount} todos`, 'success');
        } catch (error) {
            console.error('Import failed:', error);
            this.showToast('Import Failed', error.message || 'Could not import todos', 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const todos = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const todo = {};
            
            headers.forEach((header, index) => {
                if (values[index]) {
                    todo[header.toLowerCase()] = values[index].replace(/^"(.*)"$/, '$1');
                }
            });

            if (todo.text) {
                todos.push({
                    text: todo.text,
                    priority: todo.priority || 'medium',
                    completed: todo.completed === 'true'
                });
            }
        }

        return { todos };
    }

    // Shortcuts Modal
    showShortcutsModal() {
        this.shortcutsModal.classList.add('show');
    }

    hideShortcutsModal() {
        this.shortcutsModal.classList.remove('show');
    }

    // Bulk Operations
    selectAllTodos() {
        const visibleTodos = this.getFilteredTodos();
        visibleTodos.forEach(todo => this.selectedTodos.add(todo.id));
        this.updateBulkActions();
        this.renderTodos();
    }

    deselectAllTodos() {
        this.selectedTodos.clear();
        this.updateBulkActions();
        this.renderTodos();
    }

    toggleTodoSelection(id) {
        if (this.selectedTodos.has(id)) {
            this.selectedTodos.delete(id);
        } else {
            this.selectedTodos.add(id);
        }
        this.updateBulkActions();
        this.renderTodos();
    }

    async bulkOperation(operation) {
        const selectedIds = Array.from(this.selectedTodos);
        if (selectedIds.length === 0) return;

        const confirmMessage = {
            complete: `Mark ${selectedIds.length} todos as completed?`,
            uncomplete: `Mark ${selectedIds.length} todos as active?`,
            delete: `Delete ${selectedIds.length} selected todos?`
        };

        if (!confirm(confirmMessage[operation])) return;

        try {
            await this.apiRequest('/todos/bulk', {
                method: 'PUT',
                body: JSON.stringify({
                    operation,
                    todoIds: selectedIds
                })
            });

            if (operation === 'delete') {
                this.todos = this.todos.filter(todo => !selectedIds.includes(todo.id));
            } else {
                const completed = operation === 'complete';
                this.todos.forEach(todo => {
                    if (selectedIds.includes(todo.id)) {
                        todo.completed = completed;
                    }
                });
            }

            this.selectedTodos.clear();
            this.updateBulkActions();
            this.renderTodos();
            this.updateStats();
            
            const actionText = operation === 'delete' ? 'deleted' : 
                             operation === 'complete' ? 'completed' : 'marked as active';
            this.showToast('Bulk Operation', `${selectedIds.length} todos ${actionText}`, 'success');
        } catch (error) {
            console.error('Bulk operation failed:', error);
            this.showToast('Bulk Operation Failed', 'Could not perform bulk operation', 'error');
        }
    }

    updateBulkActions() {
        const count = this.selectedTodos.size;
        this.selectedCount.textContent = count;
        
        if (count > 0) {
            this.bulkActions.classList.add('show');
        } else {
            this.bulkActions.classList.remove('show');
        }
    }

    // Date utilities
    formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return { text: '📅 Today', class: 'today' };
        } else if (date.getTime() === tomorrow.getTime()) {
            return { text: '📅 Tomorrow', class: 'upcoming' };
        } else if (date < today) {
            return { text: `📅 Overdue (${date.toLocaleDateString()})`, class: 'overdue' };
        } else {
            return { text: `📅 ${date.toLocaleDateString()}`, class: 'upcoming' };
        }
    }

    isOverdue(dateString) {
        if (!dateString) return false;
        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    isDueToday(dateString) {
        if (!dateString) return false;
        const dueDate = new Date(dateString);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString();
    }

    // Drag and Drop functionality
    addDragAndDropListeners() {
        const todoItems = this.todoList.querySelectorAll('.todo-item');
        
        todoItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target !== this.draggedElement) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    async handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        if (e.target === this.draggedElement) return;
        
        const draggedId = parseInt(this.draggedElement.dataset.todoId);
        const targetId = parseInt(e.target.dataset.todoId);
        
        if (!draggedId || !targetId) return;
        
        try {
            // Reorder todos locally first
            const draggedTodo = this.todos.find(t => t.id === draggedId);
            const targetTodo = this.todos.find(t => t.id === targetId);
            
            if (!draggedTodo || !targetTodo) return;
            
            // Get all todos in display order
            const allTodos = [...this.todos].sort((a, b) => a.orderIndex - b.orderIndex);
            const draggedIndex = allTodos.findIndex(t => t.id === draggedId);
            const targetIndex = allTodos.findIndex(t => t.id === targetId);
            
            // Remove dragged item and insert at new position
            allTodos.splice(draggedIndex, 1);
            allTodos.splice(targetIndex, 0, draggedTodo);
            
            // Update order indices
            const reorderData = allTodos.map((todo, index) => ({
                id: todo.id,
                orderIndex: index
            }));
            
            // Update backend
            await this.apiRequest('/todos/bulk', {
                method: 'PUT',
                body: JSON.stringify({
                    operation: 'reorder',
                    todoIds: [],
                    data: reorderData
                })
            });
            
            // Update local data
            allTodos.forEach((todo, index) => {
                todo.orderIndex = index;
            });
            
            this.renderTodos();
            this.showToast('Reordered', 'Todo order updated', 'success', 2000);
        } catch (error) {
            console.error('Failed to reorder todos:', error);
            this.showToast('Reorder Failed', 'Could not update order', 'error');
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        // Remove drag-over class from all items
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        this.draggedElement = null;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Handle app updates and connectivity
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (window.app) {
        window.app.loadTodos();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});