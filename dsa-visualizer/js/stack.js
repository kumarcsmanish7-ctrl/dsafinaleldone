// stack.js - Stack visualizer and operations

class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        if (this.isEmpty()) return null;
        return this.items.pop();
    }

    peek() {
        if (this.isEmpty()) return null;
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }
}

class StackVisualizer {
    static init(visualizationArea, operationsDiv, timeComplexityP, spaceComplexityP, animationSpeed) {
        this.stack = new Stack();
        this.visualizationArea = visualizationArea;
        this.operationsDiv = operationsDiv;
        this.timeComplexityP = timeComplexityP;
        this.spaceComplexityP = spaceComplexityP;
        this.animationSpeed = animationSpeed;

        this.setupUI();
        this.updateVisualization();
        this.updateComplexity();
    }

    static setupUI() {
        this.operationsDiv.innerHTML = `
            <h3>Stack Operations</h3>
            <input type="text" id="stack-input" placeholder="Enter value">
            <button id="push-btn" class="tooltip">Push
                <span class="tooltiptext">Add element to top of stack - O(1)</span>
            </button>
            <button id="pop-btn" class="tooltip">Pop
                <span class="tooltiptext">Remove element from top of stack - O(1)</span>
            </button>
            <button id="peek-btn" class="tooltip">Peek
                <span class="tooltiptext">View top element without removing - O(1)</span>
            </button>
            <!-- Infix converter moved to dedicated Infix feature -->
        `;

        document.getElementById('push-btn').addEventListener('click', () => this.push());
        document.getElementById('pop-btn').addEventListener('click', () => this.pop());
        document.getElementById('peek-btn').addEventListener('click', () => this.peek());
        // (conversion UI removed from Stack) 
    }

    static async push() {
        const input = document.getElementById('stack-input');
        const value = input.value.trim();
        if (value === '') return;

        this.stack.push(value);
        await this.updateVisualization();
        this.updateComplexity();
        input.value = '';
    }

    static async pop() {
        if (this.stack.isEmpty()) {
            alert('Stack is empty!');
            return;
        }

        const poppedElement = this.stack.pop();
        await this.updateVisualization();
        this.updateComplexity();
        alert(`Popped: ${poppedElement}`);
    }

    static peek() {
        const top = this.stack.peek();
        if (top === null) {
            alert('Stack is empty!');
        } else {
            alert(`Top element: ${top}`);
        }
        this.updateComplexity();
    }

    static async updateVisualization() {
        this.visualizationArea.innerHTML = '<div class="stack"></div>';
        const stackDiv = this.visualizationArea.querySelector('.stack');

        for (let i = 0; i < this.stack.items.length; i++) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'stack-item';
            itemDiv.textContent = this.stack.items[i];
            stackDiv.appendChild(itemDiv);
            await Animations.animateStackPush(itemDiv, this.animationSpeed);
        }
    }

    static updateComplexity() {
        this.timeComplexityP.textContent = 'Time Complexity: O(1) for Push, Pop, Peek';
        this.spaceComplexityP.textContent = 'Space Complexity: O(n)';
    }
    
}