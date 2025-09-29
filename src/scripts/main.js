'use strict';

const parseSalary = (text) => Number(text.replace(/[$,\s]/g, '')) || 0;
const formatSalary = (num) => `$${Number(num).toLocaleString('en-US')}`;

const table = document.querySelector('table');
const thead = table.querySelector('thead');
const tbody = table.querySelector('tbody');

let lastSortedCol = -1;
let isAsc = true;

const getCellValue = (tr, colIdx) => {
  const text = tr.cells[colIdx].textContent.trim();

  if (colIdx === 3) {
    return Number(text);
  }

  if (colIdx === 4) {
    return parseSalary(text);
  }

  return text.toLowerCase();
};

const sortByColumn = (colIdx, asc) => {
  const rows = Array.from(tbody.rows);

  rows.sort((a, b) => {
    const v1 = getCellValue(a, colIdx);
    const v2 = getCellValue(b, colIdx);

    if (v1 < v2) {
      return asc ? -1 : 1;
    }

    if (v1 > v2) {
      return asc ? 1 : -1;
    }

    return 0;
  });
  rows.forEach((tr) => tbody.appendChild(tr));
};

thead.addEventListener('click', (e) => {
  const th = e.target.closest('th');

  if (!th) {
    return;
  }

  const colIdx = Array.from(thead.querySelectorAll('th')).indexOf(th);

  if (colIdx === lastSortedCol) {
    isAsc = !isAsc;
  } else {
    lastSortedCol = colIdx;
    isAsc = true;
  }
  sortByColumn(colIdx, isAsc);
});

tbody.addEventListener('click', (e) => {
  const tr = e.target.closest('tr');

  if (!tr) {
    return;
  }
  Array.from(tbody.rows).forEach((row) => row.classList.remove('active'));
  tr.classList.add('active');
});

const showNotification = (type, title, text) => {
  const box = document.createElement('div');

  box.setAttribute('data-qa', 'notification');
  box.className = type;
  box.style.position = 'fixed';
  box.style.right = '24px';
  box.style.bottom = '24px';
  box.style.zIndex = '1000';
  box.style.padding = '12px 16px';
  box.style.borderRadius = '8px';
  box.style.background = type === 'success' ? '#2ecc71' : '#e74c3c';
  box.style.color = '#fff';
  box.style.boxShadow = '0 6px 20px rgba(0,0,0,.2)';
  box.innerHTML = `<strong>${title}</strong><div>${text}</div>`;
  document.body.append(box);
  setTimeout(() => box.remove(), 3000);
};

const offices = [
  'Tokyo',
  'Singapore',
  'London',
  'New York',
  'Edinburgh',
  'San Francisco',
];

const buildLabeledInput = (labelText, input) => {
  const label = document.createElement('label');

  label.textContent = `${labelText}: `;
  label.append(input);

  return label;
};

const createForm = () => {
  const form = document.createElement('form');

  form.className = 'new-employee-form';

  const title = document.createElement('h2');

  title.textContent = 'New employee';

  const inputName = document.createElement('input');

  inputName.name = 'name';
  inputName.type = 'text';
  inputName.setAttribute('data-qa', 'name');

  const inputPosition = document.createElement('input');

  inputPosition.name = 'position';
  inputPosition.type = 'text';
  inputPosition.setAttribute('data-qa', 'position');

  const inputAge = document.createElement('input');

  inputAge.name = 'age';
  inputAge.type = 'number';
  inputAge.setAttribute('data-qa', 'age');

  const inputSalary = document.createElement('input');

  inputSalary.name = 'salary';
  inputSalary.type = 'number';
  inputSalary.setAttribute('data-qa', 'salary');

  const selectOffice = document.createElement('select');

  selectOffice.name = 'office';
  selectOffice.setAttribute('data-qa', 'office');

  offices.forEach((city) => {
    const opt = document.createElement('option');

    opt.value = city;
    opt.textContent = city;
    selectOffice.append(opt);
  });

  const labelName = buildLabeledInput('Name', inputName);
  const labelPosition = buildLabeledInput('Position', inputPosition);
  const labelOffice = buildLabeledInput('Office', selectOffice);
  const labelAge = buildLabeledInput('Age', inputAge);
  const labelSalary = buildLabeledInput('Salary', inputSalary);

  const submit = document.createElement('button');

  submit.type = 'submit';
  submit.textContent = 'Save to table';

  form.append(
    title,
    labelName,
    labelPosition,
    labelOffice,
    labelAge,
    labelSalary,
    submit,
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const empName = inputName.value.trim();
    const empPosition = inputPosition.value.trim();
    const empOffice = selectOffice.value.trim();
    const empAge = Number(inputAge.value);
    const empSalary = Number(inputSalary.value);

    if (
      !empName ||
      !empPosition ||
      !empOffice ||
      (!empAge && empAge !== 0) ||
      (!empSalary && empSalary !== 0)
    ) {
      showNotification('error', 'Validation error', 'All fields are required');

      return;
    }

    if (empName.length < 4) {
      showNotification(
        'error',
        'Invalid name',
        'Name must be at least 4 characters',
      );

      return;
    }

    if (empAge < 18 || empAge > 90) {
      showNotification('error', 'Invalid age', 'Age must be between 18 and 90');

      return;
    }

    const tr = document.createElement('tr');

    [
      empName,
      empPosition,
      empOffice,
      String(empAge),
      formatSalary(empSalary),
    ].forEach((txt) => {
      const td = document.createElement('td');

      td.textContent = txt;
      tr.append(td);
    });
    tbody.append(tr);

    form.reset();
    showNotification('success', 'Added', 'Employee added to the table');
  });

  return form;
};

table.after(createForm());

let editing = null;

const startEdit = (td) => {
  if (editing) {
    finishEdit(true);
  }

  const colIdx = td.cellIndex;
  const initial = td.textContent.trim();
  const input = document.createElement('input');

  input.className = 'cell-input';
  input.type = colIdx === 3 || colIdx === 4 ? 'number' : 'text';
  input.value = colIdx === 4 ? parseSalary(initial) || '' : initial;
  td.textContent = '';
  td.append(input);
  input.focus();

  editing = {
    td,
    input,
    initial,
    colIdx,
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEdit(true);
    }

    if (e.key === 'Escape') {
      finishEdit(false);
    }
  });
  input.addEventListener('blur', () => finishEdit(true), { once: true });
};

const finishEdit = (save) => {
  if (!editing) {
    return;
  }

  const { td, input, initial, colIdx } = editing;
  let nextText = initial;

  if (save) {
    const val = input.value.trim();

    if (val !== '') {
      if (colIdx === 4) {
        nextText = formatSalary(Number(val));
      } else if (colIdx === 3) {
        nextText = String(Number(val));
      } else {
        nextText = val;
      }
    }
  }
  td.textContent = nextText;
  editing = null;
};

tbody.addEventListener('dblclick', (e) => {
  const td = e.target.closest('td');

  if (td) {
    startEdit(td);
  }
});
