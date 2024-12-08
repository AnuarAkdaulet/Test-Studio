let rememberedAnswers = [];
// Track the currently focused cell
let focusedCell = null;

// Add event listener to focus on table cells
document.addEventListener('DOMContentLoaded', () => {
  // Обработчик события для фокусировки на ячейке таблицы
  document.querySelectorAll('#dragDropTable td').forEach(cell => {
    // При фокусировке на ячейке мы запоминаем её как текущую
    cell.addEventListener('focus', (event) => {
      focusedCell = event.target; // Запоминаем текущую ячейку

      // Если ячейка содержит LaTeX, показываем его как текст для редактирования
      if (cell.dataset.latex) {
        cell.innerText = cell.dataset.latex; // Показать LaTeX в текстовой форме для редактирования
      }
    });

    // Обработчик события "blur", который срабатывает при потере фокуса
    cell.addEventListener('blur', (event) => {
      let cellContent = event.target.innerText.trim();

      // Проверяем, является ли содержимое LaTeX, и обновляем data-latex
      if (cellContent.startsWith("\\(") && cellContent.endsWith("\\)")) {
        event.target.dataset.latex = cellContent; // Обновляем data-latex, если содержимое в формате LaTeX
      } else {
        delete event.target.dataset.latex; // Удаляем атрибут data-latex, если это обычный текст
      }

      // Обновляем визуализацию LaTeX с помощью MathJax
      MathJax.typesetPromise([event.target]).then(() => {
        console.log("Содержимое ячейки успешно обновлено и визуализировано.");
      }).catch(err => console.error("Ошибка визуализации LaTeX после редактирования: ", err));
    });
  });

  // Существующая функция для обновления droppable элементов
  updateDroppables(); // Обновляем droppable элементы при загрузке страницы
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


function dragStart(event) {
  event.dataTransfer.setData('text', event.target.dataset.latex || event.target.innerHTML);
}

function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData('text');
  const dropTarget = event.target;

  if (dropTarget.classList.contains('droppable')) {
    let isLatex = false;
    if (data.startsWith("\\(") && data.endsWith("\\)")) {
      isLatex = true;
    }

    // Устанавливаем содержимое ячейки
    dropTarget.innerHTML = isLatex ? data : data;

    // Сохраняем содержимое в data-latex, если это LaTeX
    if (isLatex) {
      dropTarget.dataset.latex = data;
    } else {
      delete dropTarget.dataset.latex; // Удаляем атрибут, если это текст
    }

    // Рендеринг MathJax для вставленного содержимого
    MathJax.typesetPromise([dropTarget]).then(() => {
      console.log("Содержимое ячейки успешно визуализировано после перетаскивания.");
    }).catch(err => console.error("Ошибка визуализации LaTeX после перетаскивания: ", err));

    // Сделать кнопку "Проверить Тест" видимой после успешного выполнения drop
    const testCheckButton = document.getElementById('testCheckButton');
    if (testCheckButton) {
      testCheckButton.style.display = 'block';
      console.log("Кнопка 'Проверить Тест' теперь видима.");
    }
  }
}


// Store table data and create draggable items
function rememberTable() {
  rememberedAnswers = []; // Полная очистка массива с ответами
  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  const answerContainer = document.getElementById('draggableItems');

  if (!answerContainer) {
    console.error('Контейнер для перетаскиваемых элементов не найден.');
    return;
  }

  // Очищаем контейнер для перетаскиваемых элементов перед повторным заполнением
  answerContainer.innerHTML = '';

  // Основной процесс запоминания
  rows.forEach((row, rowIndex) => {
    let rowData = [];
    row.querySelectorAll('td').forEach((cell, cellIndex) => {
      const isGivenColumn = document.querySelectorAll('.givenColumn')[cellIndex]?.checked;

      if (!isGivenColumn) {
        // Используем data-latex, если оно существует, иначе используем текст ячейки
        let mathText = cell.dataset.latex || standardizeContent(cell.innerText.trim());

        // Проверка, является ли содержимое LaTeX
        let isLatex = false;
        if (mathText.startsWith("\\(") && mathText.endsWith("\\)")) {
          isLatex = true;
          mathText = mathText.slice(2, -2).trim(); // Убираем обёртку `\( ... \)`
        }

        // Сохраняем значение в атрибут data-latex для LaTeX
        if (isLatex) {
          cell.dataset.latex = `\\(${mathText}\\)`;
        } else {
          delete cell.dataset.latex; // Если это обычный текст, удаляем data-latex
        }

        // Логирование текущего содержимого ячейки перед его сохранением
        console.log(`Запоминание ячейки (${rowIndex}, ${cellIndex}):`, mathText);

        rowData.push({
          value: mathText,
          position: [rowIndex, cellIndex],
          type: isLatex ? 'latex' : 'text'
        });

        // Обновляем содержимое ячейки с использованием MathJax для рендеринга, если это LaTeX
        cell.innerHTML = isLatex ? `\\(${mathText}\\)` : mathText;
      }
    });
    rememberedAnswers.push(rowData);
  });

  // Создание перетаскиваемых элементов
  rememberedAnswers.flat().forEach(answer => {
    if (answer.value !== '') {
      const newAnswer = document.createElement('div');
      newAnswer.classList.add('draggable');
      newAnswer.setAttribute('draggable', 'true');

      // Определяем, как отобразить содержимое (как LaTeX или как обычный текст)
      if (answer.type === 'latex') {
        newAnswer.innerHTML = `\\(${answer.value}\\)`;
        newAnswer.dataset.latex = `\\(${answer.value}\\)`;
      } else {
        newAnswer.innerHTML = answer.value;
        delete newAnswer.dataset.latex; // Удаляем атрибут, если это текст
      }

      newAnswer.dataset.type = answer.type;
      newAnswer.style.width = `${answer.value.length * 8 + 20}px`;
      answerContainer.appendChild(newAnswer);
      newAnswer.addEventListener('dragstart', dragStart);
    }
  });

  // Рендеринг всех новых элементов с использованием MathJax для корректного отображения LaTeX
  MathJax.typesetPromise([answerContainer, document.querySelector('#dragDropTable')]).then(() => {
    console.log("Перетаскиваемые элементы и ячейки таблицы успешно визуализированы.");
  }).catch(err => console.error("Ошибка визуализации LaTeX: ", err));

  alert("Текущая таблица запомнена как правильная позиция.");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Create a test based on the current table
function createTest() {
  const rows = document.querySelectorAll('#dragDropTable tbody tr');
  const answerContainer = document.getElementById('draggableItems');

  if (!answerContainer) {
    console.error('Контейнер для перетаскиваемых элементов не найден.');
    return;
  }

  // Очищаем контейнер для перетаскиваемых элементов перед заполнением
  answerContainer.innerHTML = '';

  // Собираем ответы для перетаскивания и очищаем ячейки таблицы
  let answers = [];
  rows.forEach((row, rowIndex) => {
    row.querySelectorAll('td').forEach((cell, cellIndex) => {
      const isGivenColumn = document.querySelectorAll('.givenColumn')[cellIndex]?.checked;

      if (!isGivenColumn) {
        const mathText = cell.dataset.latex || cell.innerText.trim();

        // Собираем все ответы в массив для перемешивания
        if (mathText !== '') {
          answers.push({
            value: mathText,
            isLatex: !!cell.dataset.latex,
            type: cell.dataset.latex ? 'latex' : 'text',
          });

          // Очищаем содержимое ячейки таблицы
          cell.innerHTML = '';
          delete cell.dataset.latex;
        }
      }
    });
  });

  // Перемешиваем ответы
  shuffleArray(answers);

  // Создаем перетаскиваемые элементы из перемешанных ответов
  answers.forEach(answer => {
    const newAnswer = document.createElement('div');
    newAnswer.classList.add('draggable');
    newAnswer.setAttribute('draggable', 'true');

    // Определяем, является ли содержимое LaTeX или обычным текстом
    if (answer.isLatex) {
      // Если уже есть \\( и \\), не добавляем повторно
      if (!answer.value.startsWith('\\(') && !answer.value.endsWith('\\)')) {
        newAnswer.innerHTML = `\\(${answer.value}\\)`;
        newAnswer.dataset.latex = `\\(${answer.value}\\)`;
      } else {
        newAnswer.innerHTML = answer.value;
        newAnswer.dataset.latex = answer.value;
      }
    } else {
      newAnswer.innerHTML = answer.value;
      delete newAnswer.dataset.latex; // Удаляем атрибут, если это текст
    }

    newAnswer.dataset.type = answer.type;
    newAnswer.style.width = `${answer.value.length * 8 + 20}px`;
    answerContainer.appendChild(newAnswer);
    newAnswer.addEventListener('dragstart', dragStart);
  });

  // Рендеринг всех новых элементов с использованием MathJax для корректного отображения LaTeX
  MathJax.typesetPromise([answerContainer]).then(() => {
    console.log("Перетаскиваемые элементы успешно визуализированы при создании теста.");
  }).catch(err => console.error("Ошибка визуализации LaTeX при создании теста: ", err));

  alert("Тест успешно создан. Перетаскиваемые элементы готовы.");
}


// Check the answers in the test
function checkTest() {
  console.log("Начало выполнения checkTest");

  let isCorrect = true;
  let correctCount = 0; // Counter for correct answers
  let incorrectCount = 0; // Counter for incorrect answers

  rememberedAnswers.forEach(rowData => {
    rowData.forEach(cellData => {
      const rowIndex = cellData.position[0];
      const cellIndex = cellData.position[1];

      const cell = document.querySelector(`#dragDropTable tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${cellIndex + 1})`);
      const expectedValue = cellData.value;
      let actualValue = cell.dataset.latex || cell.innerText.trim();

      // Нормализация значений для сравнения
      const normalizedExpectedValue = expectedValue.replace(/^\\\(/, '').replace(/\\\)$/, '').trim();
      const normalizedActualValue = actualValue.replace(/^\\\(/, '').replace(/\\\)$/, '').trim();

      console.log(`Проверка ячейки (${rowIndex}, ${cellIndex})`);
      console.log(`Ожидаемое значение (нормализованное): ${normalizedExpectedValue}`);
      console.log(`Фактическое значение (нормализованное): ${normalizedActualValue}`);

      // Сравниваем нормализованные значения
      if (normalizedExpectedValue === normalizedActualValue) {
        cell.style.backgroundColor = 'lightgreen'; // Зелёный цвет для правильного ответа
        correctCount++; // Increment correct count
      } else {
        cell.style.backgroundColor = 'lightcoral'; // Красный цвет для неправильного ответа
        console.warn(`Несоответствие в ячейке (${rowIndex}, ${cellIndex})`);
        incorrectCount++; // Increment incorrect count
        isCorrect = false;
      }
    });
  });

  // Alert with the count of correct and incorrect answers
  alert(`Результаты проверки:\nПравильных ответов: ${correctCount}\nНеправильных ответов: ${incorrectCount}`);


  console.log("Завершение выполнения checkTest");
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

        // После загрузки нужно снова применить слушатели событий для новых ячеек
        reapplyTableListeners();
        updateDroppables();

        document.querySelectorAll('.draggable').forEach(item => {
          item.setAttribute('draggable', 'true');
          item.addEventListener('dragstart', dragStart);
        });

        // Рендеринг MathJax для загруженного содержимого
        MathJax.typesetPromise().then(() => {
          console.log("Тест загружен и LaTeX отрендерен корректно.");
        });

        // Если тест загружает студент, ячейки не должны быть редактируемыми
        if (who === 'student') {
          document.querySelectorAll('#dragDropTable td').forEach(cell => {
            cell.setAttribute('contenteditable', 'false');
          });

          // Показываем кнопку "Проверить Тест"
          document.getElementById('testCheckButton').style.display = 'block';
        }
      };
			
      reader.readAsText(file);
    }
  };
  input.click();
}


// Reapply event listeners for the loaded table
function reapplyTableListeners() {
  document.querySelectorAll('#dragDropTable td').forEach(cell => {
    // Обработчик для фокусировки на ячейке
    cell.addEventListener('focus', (event) => {
      focusedCell = event.target; // Запоминаем текущую ячейку

      // Если ячейка содержит LaTeX, показываем его как текст для редактирования
      if (cell.dataset.latex) {
        cell.innerText = cell.dataset.latex; // Показать LaTeX в текстовой форме для редактирования
      }
    });

    // Обработчик для потери фокуса на ячейке
    cell.addEventListener('blur', (event) => {
      let cellContent = event.target.innerText.trim();

      // Проверяем, является ли содержимое LaTeX, и обновляем data-latex
      if (cellContent.startsWith("\\(") && cellContent.endsWith("\\)")) {
        event.target.dataset.latex = cellContent; // Обновляем data-latex, если содержимое в формате LaTeX
      } else {
        delete event.target.dataset.latex; // Удаляем атрибут data-latex, если это обычный текст
      }

      // Обновляем визуализацию LaTeX с помощью MathJax
      MathJax.typesetPromise([event.target]).then(() => {
        console.log("Содержимое ячейки успешно обновлено и визуализировано.");
      }).catch(err => console.error("Ошибка визуализации LaTeX после редактирования: ", err));
    });
  });
}
function importTable() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = e => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Check and adapt imported structure
          const tableBody = document.querySelector('#dragDropTable tbody');
          const headerRow = document.querySelector('#headerRow');

          if (!importedData.headers || !Array.isArray(importedData.headers)) {
            alert("Invalid JSON format: Missing headers array.");
            return;
          }
          if (!importedData.rows || !Array.isArray(importedData.rows)) {
            alert("Invalid JSON format: Missing rows array.");
            return;
          }

          // Populate headers
          headerRow.innerHTML = '';
          importedData.headers.forEach(header => {
            const th = document.createElement('th');
            th.contentEditable = true;
            th.innerHTML = header + ' <input type="checkbox" class="givenColumn">';
            headerRow.appendChild(th);
          });

          // Populate rows
          tableBody.innerHTML = '';
          importedData.rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cellData => {
              const td = document.createElement('td');
              td.classList.add('droppable');
              td.contentEditable = true;

              if (cellData.type === 'latex') {
                td.dataset.latex = cellData.value;
                td.innerHTML = `\\(${cellData.value}\\)`;
              } else {
                td.innerHTML = cellData.value;
              }
              tr.appendChild(td);
            });
            tableBody.appendChild(tr);
          });

          // Reapply necessary event listeners and update droppables
          reapplyTableListeners();
          updateDroppables();

          // Render MathJax
          MathJax.typesetPromise().then(() => {
            console.log("Imported table rendered successfully.");
          });

          alert("Table imported successfully!");
        } catch (error) {
          console.error("Error importing table:", error);
          alert("Failed to import table. Ensure the JSON format is correct.");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
