class ItineraryPlanner {
    constructor() {
        this.board = document.getElementById('itineraryBoard');
        this.addDayBtn = document.getElementById('addDay');
        this.saveBtn = document.getElementById('save');
        this.resetBtn = document.getElementById('reset');
        this.days = [];
        
        this.colors = ['#2196F3', '#4CAF50', '#f44336', '#FF9800', '#9C27B0', '#00BCD4'];
        this.themeBtn = document.getElementById('themeToggle');
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.initializeTheme();

        this.initializeEventListeners();
        this.loadFromStorage();
    }

    initializeEventListeners() {
        this.addDayBtn.addEventListener('click', () => this.addDay());
        this.saveBtn.addEventListener('click', () => this.saveToStorage());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    initializeTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.themeBtn.querySelector('i').classList.replace('fa-sun', 'fa-moon');
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        this.themeBtn.querySelector('i').classList.toggle('fa-sun');
        this.themeBtn.querySelector('i').classList.toggle('fa-moon');
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    createSubActivity(content = '') {
        const subActivity = document.createElement('div');
        subActivity.className = 'sub-activity';
        subActivity.draggable = true;
        subActivity.innerHTML = `
            <i class="fas fa-grip-lines drag-handle"></i>
            <input type="text" placeholder="Sub-activity..." value="${content}">
            <button class="remove-sub" title="Remove sub-activity">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add drag functionality for sub-activities
        subActivity.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            subActivity.classList.add('dragging-sub');
        });

        subActivity.addEventListener('dragend', () => {
            subActivity.classList.remove('dragging-sub');
        });

        subActivity.querySelector('.remove-sub').addEventListener('click', () => {
            subActivity.remove();
        });

        return subActivity;
    }

    createDayCard(dayNumber, activities = '', color = this.colors[0], subActivities = []) {
        const card = document.createElement('div');
        card.className = 'day-card';
        card.draggable = true;
        card.style.borderLeft = `5px solid ${color}`;
        
        card.innerHTML = `
            <div class="card-header">
                <h2><i class="fas fa-calendar-day"></i> Day ${dayNumber}</h2>
                <div class="card-controls">
                    <div class="color-select-wrapper">
                        <select class="color-picker" title="Change card color">
                            ${this.colors.map(c => `
                                <option value="${c}" ${c === color ? 'selected' : ''}>
                                    <span class="color-preview" style="background-color: ${c}"></span>
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="activities">
                <textarea placeholder="🎯 Main activities for the day...">${activities}</textarea>
                <div class="sub-activities" ondragover="event.preventDefault()">
                    ${subActivities.map(sub => this.createSubActivity(sub)).join('')}
                </div>
                <button class="add-sub-activity"><i class="fas fa-plus"></i> Add Sub-Activity</button>
            </div>
        `;

        // Add sub-activities container drag handling
        const subActivitiesContainer = card.querySelector('.sub-activities');
        subActivitiesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(subActivitiesContainer, e.clientY);
            const draggable = document.querySelector('.dragging-sub');
            if (draggable && draggable !== afterElement) {
                if (afterElement) {
                    subActivitiesContainer.insertBefore(draggable, afterElement);
                } else {
                    subActivitiesContainer.appendChild(draggable);
                }
            }
        });

        // Add event listeners for new features
        card.querySelector('.color-picker').addEventListener('change', (e) => {
            card.style.borderLeft = `5px solid ${e.target.value}`;
        });

        card.querySelector('.add-sub-activity').addEventListener('click', () => {
            const subActivitiesContainer = card.querySelector('.sub-activities');
            subActivitiesContainer.appendChild(this.createSubActivity());
        });

        // Add hover effect for drag hint
        card.addEventListener('mouseenter', () => {
            card.title = 'Drag to reorder';
        });

        this.setupDragListeners(card);
        return card;
    }

    setupDragListeners(card) {
        card.addEventListener('dragstart', e => {
            e.stopPropagation();
            card.classList.add('dragging');
            // Add a slight delay for better visual feedback
            requestAnimationFrame(() => {
                card.style.opacity = '0.9';
            });
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            card.style.opacity = ''; // Reset opacity
        });

        card.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.board, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement) {
                this.board.insertBefore(draggable, afterElement);
            } else {
                this.board.appendChild(draggable);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.day-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addDay() {
        const dayNumber = this.board.children.length + 1;
        const card = this.createDayCard(dayNumber);
        this.board.appendChild(card);
    }

    saveToStorage() {
        const days = Array.from(this.board.children).map(card => ({
            activities: card.querySelector('textarea').value,
            color: card.style.borderLeft.match(/#[0-9a-f]{6}/i)[0],
            subActivities: Array.from(card.querySelectorAll('.sub-activity input'))
                .map(input => input.value)
        }));
        localStorage.setItem('itinerary', JSON.stringify(days));
        
        // Add save confirmation animation
        const saveBtn = document.getElementById('save');
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        }, 2000);
    }

    loadFromStorage() {
        const saved = localStorage.getItem('itinerary');
        if (saved) {
            const days = JSON.parse(saved);
            days.forEach((day, index) => {
                const card = this.createDayCard(
                    index + 1, 
                    day.activities, 
                    day.color, 
                    day.subActivities || []
                );
                this.board.appendChild(card);
            });
        }
    }

    reset() {
        if (confirm('Are you sure you want to reset the itinerary?')) {
            localStorage.removeItem('itinerary');
            this.board.innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ItineraryPlanner();
});
