let rememberedAnswers = [];
// Track the currently focused cell
let focusedCell = null;

// Add event listener to focus on table cells
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#dragDropTable td').forEach(cell => {
    cell.addEventListener('focus', (event) => {
      focusedCell = event.target; // Track the focused cell
    });
  });
  updateDroppables(); // Ensure droppables are updated on page load
});

// Add a new row to the table
function addRow() {
  const tableBody = document.querySelector('#dragDropTable tbody');
  if (!tableBody) {
    console.error('Table body not found.');
    return;
  }

  const newRow = tableBody.insertRow();
  const columnsCount = document.querySelectorAll('#headerRow th').length;

  for (let i = 0; i < columnsCount; i++) {
    const newCell = newRow.insertCell();
    newCell.classList.add('droppable');
    newCell.setAttribute('contenteditable', 'true');

    // Add event listener to track the focus for the new cells
    newCell.addEventListener('focus', (event) => {
      focusedCell = event.target;
    });
  }
  updateDroppables();
}

// Add a new column to the table
function addColumn() {
  const headerRow = document.getElementById('headerRow');
  if (!headerRow) {
    console.error('Header row not found.');
    return;
  }

  const newHeaderCell = document.createElement('th');
  newHeaderCell.setAttribute('contenteditable', 'true');
  newHeaderCell.innerHTML = 'Новый Столбец <input type="checkbox" class="givenColumn">';
  headerRow.appendChild(newHeaderCell);

  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  rows.forEach(row => {
    const newCell = row.insertCell();
    newCell.classList.add('droppable');
    newCell.setAttribute('contenteditable', 'true');

    // Add event listener to track the focus for the new cells
    newCell.addEventListener('focus', (event) => {
      focusedCell = event.target;
    });
  });
  updateDroppables();
}

// Optimized function to delete the current row
function deleteCurrentRow() {
  if (focusedCell && focusedCell.tagName === 'TD') {
    const row = focusedCell.parentNode;
    const tableBody = row.parentNode;

    if (tableBody.rows.length > 1) { // Ensure at least one row remains
      row.remove(); // Remove the current row
      updateDroppables(); // Update droppable areas if needed
    } else {
      alert('You cannot delete the last row.');
    }
  } else {
    alert('Please select a cell in the row you wish to delete.');
  }
}

// Function to delete the current column
function deleteCurrentColumn() {
  if (focusedCell && focusedCell.tagName === 'TD') {
    const cellIndex = Array.prototype.indexOf.call(focusedCell.parentNode.children, focusedCell);
    const rows = document.querySelectorAll('#dragDropTable tr');

    rows.forEach(row => {
      if (row.children[cellIndex]) {
        row.removeChild(row.children[cellIndex]); // Remove each cell in the column
      }
    });
  } else {
    alert('Please select a cell to delete the column.');
  }
}

// Function to update droppable areas
function updateDroppables() {
  const droppables = document.querySelectorAll('.droppable');
  droppables.forEach(droppable => {
    droppable.addEventListener('dragover', dragOver);
    droppable.addEventListener('drop', drop);
  });
}

// Helper functions for drag and drop (assuming they're already defined)
function dragOver(event) {
  event.preventDefault();
}
/*
function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData('text');
  const dropTarget = event.target;

  if (dropTarget.classList.contains('droppable')) {
    dropTarget.innerHTML = data;
  }
}
*/




function dragStart(event) {
  event.dataTransfer.setData('text', event.target.dataset.latex || event.target.innerHTML);
}

function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData('text');
  const dropTarget = event.target;

  if (dropTarget.classList.contains('droppable')) {
    const droppedAnswer = rememberedAnswers.flat().find(answer => answer.value === data);
    const isLatex = droppedAnswer && droppedAnswer.type === 'latex';

    if (isLatex) {
      dropTarget.innerHTML = `\\(${data}\\)`;
      MathJax.typesetPromise([dropTarget]).catch(err => console.error("Error visualizing LaTeX: ", err));
    } else {
      dropTarget.innerHTML = data;
    }
    dropTarget.dataset.droppedValue = data; // Save value for checking later
  }
}

// Store table data and create draggable items
function rememberTable() {
  rememberedAnswers = [];
  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  const answerContainer = document.getElementById('draggableItems');
  if (!answerContainer) {
    console.error('Answer container not found.');
    return;
  }
  answerContainer.innerHTML = '';

  rows.forEach((row, rowIndex) => {
    let rowData = [];
    row.querySelectorAll('td').forEach((cell, cellIndex) => {
      const isGivenColumn = document.querySelectorAll('.givenColumn')[cellIndex]?.checked;
      if (!isGivenColumn) {
        let mathText = standardizeContent(cell.innerText.trim());

        // Check if content is LaTeX
        const isLatex = mathText.startsWith("\\(") && mathText.endsWith("\\)");
        if (isLatex) {
          mathText = mathText.slice(2, -2).trim();
        }

        rowData.push({
          value: mathText,
          position: [rowIndex, cellIndex],
          type: isLatex ? 'latex' : 'text'
        });
      }
    });
    rememberedAnswers.push(rowData);
  });

  // Create draggable elements
  rememberedAnswers.flat().forEach(answer => {
    if (answer.value !== '') {
      const newAnswer = document.createElement('div');
      newAnswer.classList.add('draggable');
      newAnswer.setAttribute('draggable', 'true');
      newAnswer.innerHTML = answer.type === 'latex' ? `\\(${answer.value}\\)` : answer.value;
      newAnswer.dataset.latex = answer.value;
      newAnswer.dataset.type = answer.type;
      newAnswer.style.width = `${answer.value.length * 8 + 20}px`;
      answerContainer.appendChild(newAnswer);
      newAnswer.addEventListener('dragstart', dragStart);
    }
  });

  MathJax.typesetPromise().then(() => {
    console.log("Draggable elements visualized correctly.");
  });

  alert("Текущая таблица запомнена как правильная позиция.");
}

// Create a test based on the current table
function createTest() {
  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  rows.forEach((row, rowIndex) => {
    row.querySelectorAll('td').forEach((cell, cellIndex) => {
      const isGivenColumn = document.querySelectorAll('.givenColumn')[cellIndex]?.checked;
      if (!isGivenColumn) {
        cell.innerHTML = '';
        cell.classList.add('droppable');
        delete cell.dataset.droppedValue; // Clear saved value
      } else {
        cell.classList.remove('droppable');
      }
    });
  });

  // Shuffle draggable items
  const draggableItems = Array.from(document.getElementById('draggableItems').children);
  draggableItems.sort(() => Math.random() - 0.5);
  document.getElementById('draggableItems').innerHTML = '';
  draggableItems.forEach(item => document.getElementById('draggableItems').appendChild(item));

  updateDroppables();
  document.getElementById('testCheckButton').style.display = 'block';
  MathJax.typeset(); // Re-render LaTeX content
  alert("Тест создан. Теперь заполните пустые ячейки, перетаскивая ответы.");
}

// Check the answers in the test
function checkTest() {
  let correct = true;
  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  rows.forEach((row, rowIndex) => {
    row.querySelectorAll('td').forEach((cell, cellIndex) => {
      const isGivenColumn = document.querySelectorAll('.givenColumn')[cellIndex]?.checked;
      if (!isGivenColumn) {
        const expectedAnswer = rememberedAnswers[rowIndex]?.[cellIndex]?.value || "";
        const actualAnswer = cell.dataset.droppedValue ? standardizeContent(cell.dataset.droppedValue) : "";

        if (expectedAnswer !== actualAnswer) {
          correct = false;
          cell.style.backgroundColor = '#f8d7da'; // Red background for wrong answers
        } else {
          cell.style.backgroundColor = '#d4edda'; // Green background for correct answers
        }
      }
    });
  });

  alert(correct ? 'Все ответы правильные!' : 'Некоторые ответы неверны. Попробуйте снова.');
}

// Function to standardize content (remove extra spaces)
function standardizeContent(content) {
  return content.replace(/\s+/g, ' ').trim();
}

// Save the test data to a file
function saveTest() {
  const tableContainer = document.querySelector('.table-responsive');
  const answersContainer = document.getElementById('answersContainer');

  if (!tableContainer || !answersContainer) {
    console.error('Required elements not found in the DOM.');
    return;
  }

  const testData = {
    rememberedAnswers,
    tableHTML: tableContainer.innerHTML,
    draggableHTML: answersContainer.innerHTML
  };

  const blob = new Blob([JSON.stringify(testData)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'test_data.json';
  link.click();
}

// Load test data from a file
function loadTest(who) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  
  input.onchange = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = e => {
        const testData = JSON.parse(e.target.result);
        const tableContainer = document.querySelector('.table-responsive');
        const answersContainer = document.getElementById('answersContainer');

        if (!tableContainer || !answersContainer) {
          console.error('Required elements not found in the DOM.');
          return;
        }

        rememberedAnswers = testData.rememberedAnswers;
        tableContainer.innerHTML = testData.tableHTML;
        answersContainer.innerHTML = testData.draggableHTML;

        // After loading, we need to reapply event listeners for new table cells
        reapplyTableListeners();
        updateDroppables();

        document.querySelectorAll('.draggable').forEach(item => {
          item.setAttribute('draggable', 'true');
          item.addEventListener('dragstart', dragStart);
        });

        MathJax.typesetPromise().then(() => {
          console.log("Test loaded and LaTeX rendered correctly.");
        });
      };
			
      reader.readAsText(file);
    }
  };
  if (who === 'student') {
    document.getElementById('testCheckButton').style.display = 'block';
  }
  input.click();
}

// Reapply event listeners for the loaded table
function reapplyTableListeners() {
  document.querySelectorAll('#dragDropTable td').forEach(cell => {
    cell.addEventListener('focus', (event) => {
      focusedCell = event.target; // Track the focused cell for row/column deletion
    });
  });
}

