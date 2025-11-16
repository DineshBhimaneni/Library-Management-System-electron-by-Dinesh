// Load data from localStorage on page load
let books = JSON.parse(localStorage.getItem('books')) || [];
let students = JSON.parse(localStorage.getItem('students')) || [];
let borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks')) || [];
let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
let reservations = JSON.parse(localStorage.getItem('reservations')) || [];

// Pagination and Sorting Variables
let currentPageBooks = 1;
let currentPageStudents = 1;
let currentPageBorrowed = 1;
const rowsPerPage = 5;

// Fine Rate (e.g., $1 per day)
const fineRate = 1;

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check if dark mode is enabled in localStorage
if (localStorage.getItem('darkMode') === 'enabled') {
  body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️ Light Mode';
}

// Toggle Dark Mode
darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
    darkModeToggle.textContent = '☀️ Light Mode';
  } else {
    localStorage.setItem('darkMode', 'disabled');
    darkModeToggle.textContent = '🌙 Dark Mode';
  }
});

// Save data to localStorage whenever it changes
function saveData() {
  localStorage.setItem('books', JSON.stringify(books));
  localStorage.setItem('students', JSON.stringify(students));
  localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
  localStorage.setItem('reservations', JSON.stringify(reservations));
  updateDashboard(); // Update dashboard stats
}

// Render Paginated Table with Sorting
function renderPaginatedTable(data, tableId, currentPage, rowsPerPage, sortBy = null, sortOrder = 'asc') {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';

  // Sort data if sortBy is provided
  if (sortBy) {
    data.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = data.slice(start, end);

  paginatedData.forEach(item => {
    if (tableId === 'bookTable') {
      const isBorrowed = borrowedBooks.some(b => b.bookId == item.id && !b.returnDate);
      const isReserved = reservations.some(r => r.bookId == item.id && new Date(r.reservationExpiry) > new Date());
      const status = isBorrowed ? "Borrowed" : isReserved ? "Reserved" : "Available";
      const row = `
        <tr>
          <td>${item.id}</td>
          <td>${item.title}</td>
          <td>${item.author}</td>
          <td>${item.year}</td>
          <td>${item.category || 'N/A'}</td>
          <td>${item.barcode || 'N/A'}</td>
          <td>${status}</td>
          <td>
            <button class="edit" onclick="editBook(${item.id})">Edit</button>
            <button class="delete" onclick="deleteBook(${item.id})">Delete</button>
            ${isBorrowed ? '' : `<button class="borrow" onclick="borrowBook(${item.id}, prompt('Enter Student ID'))">Borrow</button>`}
            ${isBorrowed ? `<button class="return" onclick="returnBook(${item.id})">Return</button>` : ''}
            ${!isReserved && !isBorrowed ? `<button class="reserve" onclick="reserveBook(${item.id}, prompt('Enter Student ID'))">Reserve</button>` : ''}
          </td>
        </tr>`;
      tbody.innerHTML += row;
    } else if (tableId === 'studentTable') {
      const borrowedCount = borrowedBooks.filter(b => b.studentId == item.id && !b.returnDate).length;
      const row = `
        <tr>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.email}</td>
          <td>${item.phone}</td>
          <td>${borrowedCount} Books Borrowed</td>
          <td>
            <button onclick="editStudent(${item.id})">Edit</button>
            <button onclick="deleteStudent(${item.id})">Delete</button>
          </td>
        </tr>`;
      tbody.innerHTML += row;
    } else if (tableId === 'borrowedTable') {
      const book = books.find(b => b.id == item.bookId);
      const student = students.find(s => s.id == item.studentId);
      const today = new Date();
      const dueDate = new Date(item.dueDate);
      const isOverdue = today > dueDate && !item.returnDate;
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)); // Calculate days overdue
      const fine = isOverdue ? `$${daysOverdue * fineRate}` : 'No Fine';
      const row = `
        <tr style="${isOverdue ? 'background-color: #f8d7da;' : ''}">
          <td>${book ? book.title : 'Unknown'}</td>
          <td>${student ? student.name : 'Unknown'}</td>
          <td>${item.borrowDate}</td>
          <td>${item.dueDate}</td>
          <td>${item.returnDate || 'Not Returned'}</td>
          <td>${fine}</td>
          <td>
            ${!item.returnDate ? `<button onclick="returnBook(${item.bookId})">Return</button>` : ''}
          </td>
        </tr>`;
      tbody.innerHTML += row;
    }
  });
}

// Pagination Controls
document.getElementById('prevPageBooks').addEventListener('click', () => {
  if (currentPageBooks > 1) {
    currentPageBooks--;
    renderBooks();
  }
});

document.getElementById('nextPageBooks').addEventListener('click', () => {
  if (currentPageBooks < Math.ceil(books.length / rowsPerPage)) {
    currentPageBooks++;
    renderBooks();
  }
});

document.getElementById('prevPageStudents').addEventListener('click', () => {
  if (currentPageStudents > 1) {
    currentPageStudents--;
    renderStudents();
  }
});

document.getElementById('nextPageStudents').addEventListener('click', () => {
  if (currentPageStudents < Math.ceil(students.length / rowsPerPage)) {
    currentPageStudents++;
    renderStudents();
  }
});

document.getElementById('prevPageBorrowed').addEventListener('click', () => {
  if (currentPageBorrowed > 1) {
    currentPageBorrowed--;
    renderBorrowedBooks();
  }
});

document.getElementById('nextPageBorrowed').addEventListener('click', () => {
  if (currentPageBorrowed < Math.ceil(borrowedBooks.length / rowsPerPage)) {
    currentPageBorrowed++;
    renderBorrowedBooks();
  }
});


// Sorting Functionality
function sortTable(tableId, columnIndex) {
  let data;
  if (tableId === 'bookTable') {
    data = books;
  } else if (tableId === 'studentTable') {
    data = students;
  } else if (tableId === 'borrowedTable') {
    data = borrowedBooks;
  }

  data.sort((a, b) => {
    const keyA = Object.values(a)[columnIndex];
    const keyB = Object.values(b)[columnIndex];
    return keyA.toString().localeCompare(keyB.toString());
  });

  if (tableId === 'bookTable') {
    renderBooks();
  } else if (tableId === 'studentTable') {
    renderStudents();
  } else if (tableId === 'borrowedTable') {
    renderBorrowedBooks();
  }
}


// Initial Render Functions
function renderBooks(filteredBooks = books, sortBy = null, sortOrder = 'asc') {
  renderPaginatedTable(filteredBooks, 'bookTable', currentPageBooks, rowsPerPage, sortBy, sortOrder);
  document.getElementById('currentPageBooks').textContent = `Page ${currentPageBooks}`;
}

function renderStudents(filteredStudents = students, sortBy = null, sortOrder = 'asc') {
  renderPaginatedTable(filteredStudents, 'studentTable', currentPageStudents, rowsPerPage, sortBy, sortOrder);
  document.getElementById('currentPageStudents').textContent = `Page ${currentPageStudents}`;
}

function renderBorrowedBooks(sortBy = null, sortOrder = 'asc') {
  renderPaginatedTable(borrowedBooks, 'borrowedTable', currentPageBorrowed, rowsPerPage, sortBy, sortOrder);
  document.getElementById('currentPageBorrowed').textContent = `Page ${currentPageBorrowed}`;
}

// Book Management
document.getElementById('bookForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const id = document.getElementById('bookId').value;
  const title = document.getElementById('bookTitle').value;
  const author = document.getElementById('bookAuthor').value;
  const year = document.getElementById('bookYear').value;
  const category = document.getElementById('bookCategory').value; // Get category
  const barcode = document.getElementById('bookBarcode').value || generateBarcode(id); // Optional barcode
  const book = { id, title, author, year, category, barcode }; // Include barcode
  const index = books.findIndex(b => b.id == id);

  if (index === -1) {
    books.push(book);
    logActivity(`Book "${title}" added.`, true); // Show alert
  } else {
    books[index] = book;
    logActivity(`Book "${title}" updated.`, true); // Show alert
  }

  renderBooks();
  saveData(); // Save data to localStorage
  this.reset();
});

function editBook(id) {
  const book = books.find(b => b.id == id);
  document.getElementById('bookId').value = book.id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookYear').value = book.year;
  document.getElementById('bookCategory').value = book.category || 'Other'; // Set category
  document.getElementById('bookBarcode').value = book.barcode || ''; // Set barcode
}

function deleteBook(id) {
  const book = books.find(b => b.id == id);
  const isConfirmed = confirm("Are you sure you want to delete this book?");
  if (isConfirmed) {
    books = books.filter(b => b.id != id);
    logActivity(`Book "${book.title}" deleted.`, true); // Show alert
    renderBooks();
    saveData(); // Save data to localStorage
  }
}

// Student Management
document.getElementById('studentForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const id = document.getElementById('studentId').value;
  const name = document.getElementById('studentName').value;
  const email = document.getElementById('studentEmail').value;
  const phone = document.getElementById('studentPhone').value;
  const student = { id, name, email, phone };
  const index = students.findIndex(s => s.id == id);

  if (index === -1) {
    students.push(student);
    logActivity(`Student "${name}" added.`, true); // Show alert
  } else {
    students[index] = student;
    logActivity(`Student "${name}" updated.`, true); // Show alert
  }

  renderStudents();
  saveData(); // Save data to localStorage
  this.reset();
});

function editStudent(id) {
  const student = students.find(s => s.id == id);
  document.getElementById('studentId').value = student.id;
  document.getElementById('studentName').value = student.name;
  document.getElementById('studentEmail').value = student.email;
  document.getElementById('studentPhone').value = student.phone;
}

function deleteStudent(id) {
  const student = students.find(s => s.id == id);
  const isConfirmed = confirm("Are you sure you want to delete this student?");
  if (isConfirmed) {
    students = students.filter(s => s.id != id);
    logActivity(`Student "${student.name}" deleted.`, true); // Show alert
    renderStudents();
    saveData(); // Save data to localStorage
  }
}

// Borrow and Return Functionality
function borrowBook(bookId, studentId) {
  if (!bookId || !studentId) {
    alert("Both Book ID and Student ID are required.");
    return;
  }

  const book = books.find(b => b.id == bookId);
  const student = students.find(s => s.id == studentId);
  if (!book || !student) {
    alert("Invalid book or student ID.");
    return;
  }

  // Check if the book is already borrowed or reserved
  const isAlreadyBorrowed = borrowedBooks.some(b => b.bookId == bookId && !b.returnDate);
  const isReserved = reservations.some(r => r.bookId == bookId && new Date(r.reservationExpiry) > new Date());
  if (isAlreadyBorrowed || isReserved) {
    alert("This book is already borrowed or reserved.");
    return;
  }

  // Check borrowing limit (maximum 3 books per student)
  const borrowedCount = borrowedBooks.filter(b => b.studentId == studentId && !b.returnDate).length;
  if (borrowedCount >= 3) {
    alert("This student has reached the borrowing limit of 3 books.");
    return;
  }

  // Add the book to the borrowed list with a due date (14 days from now)
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(borrowDate.getDate() + 14); // 14 days from borrow date
  borrowedBooks.push({
    bookId: book.id,
    studentId: student.id,
    borrowDate: borrowDate.toLocaleDateString(),
    dueDate: dueDate.toLocaleDateString(),
    returnDate: null
  });

  logActivity(`Book "${book.title}" borrowed by ${student.name}.`, true); // Show alert
  renderBooks();
  renderBorrowedBooks();
  saveData(); // Save data to localStorage
}

function returnBook(bookId) {
  const borrowedBook = borrowedBooks.find(b => b.bookId == bookId && !b.returnDate);
  if (!borrowedBook) {
    alert("This book is not currently borrowed.");
    return;
  }

  // Prompt for the specific student ID
  const studentId = prompt(`Enter the Student ID (${borrowedBook.studentId}) to confirm return:`);
  if (!studentId || studentId != borrowedBook.studentId) {
    alert("The entered Student ID does not match the borrower.");
    return;
  }

  // Mark the book as returned
  borrowedBook.returnDate = new Date().toLocaleDateString();
  const book = books.find(b => b.id == bookId);

  // Notify reservations for this book
  notifyReservations(bookId);

  logActivity(`Book "${book.title}" returned by Student ID ${studentId}.`, true);
  renderBooks();
  renderBorrowedBooks();
  saveData();
}

// Reservation System
function reserveBook(bookId, studentId) {
  // Validate Student ID
  if (!studentId || isNaN(studentId)) {
    alert("Please enter a valid Student ID.");
    return;
  }

  const student = students.find(s => s.id == studentId);
  if (!student) {
    alert("No student found with the provided ID.");
    return;
  }

  const book = books.find(b => b.id == bookId);
  if (!book) {
    alert("Invalid book ID.");
    return;
  }

  // Check if the book is already borrowed
  const isBorrowed = borrowedBooks.some(b => b.bookId == bookId && !b.returnDate);
  if (!isBorrowed) {
    alert("This book is currently available and can be borrowed directly.");
    return;
  }

  // Check if the book is already reserved
  const isReserved = reservations.some(r => r.bookId == bookId && new Date(r.reservationExpiry) > new Date());
  if (isReserved) {
    alert("This book is already reserved by another student.");
    return;
  }

  // Add the reservation with a 1-day validity
  const reservationDate = new Date();
  const reservationExpiry = new Date(reservationDate);
  reservationExpiry.setDate(reservationDate.getDate() + 1); // Reservation valid for 1 day
  reservations.push({
    bookId,
    studentId,
    reservationDate: reservationDate.toLocaleDateString(),
    reservationExpiry: reservationExpiry.toLocaleDateString()
  });

  logActivity(`Book "${book.title}" has been successfully reserved for ${student.name}.`, true); // Show alert
  renderBooks();
  saveData(); // Save data to localStorage
}

// Notify Reservations
function notifyReservations(bookId) {
  const today = new Date();
  const reservedStudents = reservations.filter(r => r.bookId == bookId && new Date(r.reservationExpiry) > today);

  reservedStudents.forEach(reservation => {
    const student = students.find(s => s.id == reservation.studentId);
    alert(`Book is now available for ${student.name}. Please borrow it soon.`);
  });

  // Remove expired or fulfilled reservations
  reservations = reservations.filter(
    r => r.bookId != bookId || new Date(r.reservationExpiry) <= today
  );
  saveData(); // Save updated reservations
}

// Activity Log
function logActivity(action, showAlert = true) {
  const timestamp = new Date().toLocaleString();
  activityLog.push(`${timestamp}: ${action}`);
  saveData(); // Save to localStorage
  renderActivityLog(); // Update the UI

  // Show an alert if requested
  if (showAlert) {
    alert(action); // Display the action as a pop-up message
  }
}

function renderActivityLog() {
  const logList = document.getElementById('logList');
  logList.innerHTML = '';
  activityLog.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    logList.appendChild(li);
  });
}

// Advanced Search for Books
document.getElementById('bookSearchButton').addEventListener('click', function () {
  const query = document.getElementById('bookSearchQuery').value.trim();
  if (!query) {
    alert("Please enter a valid search query.");
    return;
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(query.toLowerCase()) ||
    book.author.toLowerCase().includes(query.toLowerCase()) ||
    book.category?.toLowerCase().includes(query.toLowerCase()) ||
    book.year.toString().includes(query) ||
    book.id.toString() === query // Search by ID
  );

  renderBooks(filteredBooks);
});

document.getElementById('clearBookSearchButton').addEventListener('click', function () {
  document.getElementById('bookSearchQuery').value = ''; // Clear the search input
  renderBooks(); // Reset to full list
});

// Advanced Search for Students
document.getElementById('studentSearchButton').addEventListener('click', function () {
  const query = document.getElementById('studentSearchQuery').value.trim().toLowerCase();
  if (!query) {
    alert("Please enter a valid search query.");
    return;
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query) ||
    student.phone.toLowerCase().includes(query) ||
    student.id.toString() === query // Search by ID
  );

  renderStudents(filteredStudents);
});

document.getElementById('clearStudentSearchButton').addEventListener('click', function () {
  document.getElementById('studentSearchQuery').value = ''; // Clear the search input
  renderStudents(); // Reset to full list
});

// Print Functionality
function printTable(tableId) {
  const table = document.getElementById(tableId).cloneNode(true); // Clone the table
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Print</title>');
  printWindow.document.write('<style>');
  printWindow.document.write(`
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid black; padding: 8px; text-align: left; }
    th { background-color: #f0f4f8; }
  `);
  printWindow.document.write('</style></head><body>');
  printWindow.document.write('<h1>Library Management System</h1>');
  printWindow.document.write(table.outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

document.getElementById('printBooksBtn').addEventListener('click', () => printTable('bookTable'));
document.getElementById('printStudentsBtn').addEventListener('click', () => printTable('studentTable'));
document.getElementById('printBorrowedBtn').addEventListener('click', () => printTable('borrowedTable'));

// Calendar Integration
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [
      ...borrowedBooks.map(item => {
        const today = new Date();
        const dueDate = new Date(item.dueDate);
        const isOverdue = today > dueDate && !item.returnDate;

        return {
          id: item.bookId,
          title: `${books.find(b => b.id == item.bookId)?.title || 'Unknown'} (Due)`,
          start: item.dueDate,
          backgroundColor: isOverdue ? '#ff4d4d' : '#378006', // Red for overdue, green for on-time
          borderColor: '#378006',
          extendedProps: { type: 'dueDate' }
        };
      }),
      ...reservations.map(reservation => {
        const book = books.find(b => b.id == reservation.bookId);
        const student = students.find(s => s.id == reservation.studentId);
        return {
          title: `${book?.title || 'Unknown'} Reserved by ${student?.name || 'Unknown'}`,
          start: reservation.reservationDate,
          end: reservation.reservationExpiry,
          backgroundColor: '#007bff', // Blue for reservations
          borderColor: '#007bff',
          extendedProps: { type: 'reservation' }
        };
      })
    ],
    eventClick: function (info) {
      const eventType = info.event.extendedProps.type;
      if (eventType === 'dueDate') {
        alert(`Book "${info.event.title}" is due on ${info.event.start.toLocaleDateString()}.`);
      } else if (eventType === 'reservation') {
        alert(`Reservation: ${info.event.title}`);
      }
    },
    editable: true, // Enable drag-and-drop
    eventDrop: function (info) {
      const newDueDate = info.event.start.toLocaleDateString();
      const bookId = info.event.id;
      // Update the due date in the borrowedBooks array
      const borrowedBook = borrowedBooks.find(b => b.bookId == bookId);
      if (borrowedBook) {
        borrowedBook.dueDate = newDueDate;
        saveData(); // Save changes to localStorage
        alert(`Due date for book ID ${bookId} updated to ${newDueDate}.`);
      }
    }
  });

  // View Change Buttons
  document.getElementById('monthViewBtn').addEventListener('click', () => calendar.changeView('dayGridMonth'));
  document.getElementById('weekViewBtn').addEventListener('click', () => calendar.changeView('timeGridWeek'));
  document.getElementById('dayViewBtn').addEventListener('click', () => calendar.changeView('timeGridDay'));

  // Export Calendar Button
  document.getElementById('exportCalendarBtn').addEventListener('click', () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Library Management System//EN\n`;
    const events = calendar.getEvents().map(event => {
      return `BEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${formatDateForICS(event.start)}\nEND:VEVENT`;
    }).join('\n');
    const fullICS = icsContent + events + '\nEND:VCALENDAR';
    const blob = new Blob([fullICS], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  });

  calendar.render();

  // Helper function to format dates for iCal
  function formatDateForICS(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
});

// Barcode Scanning
function generateBarcode(bookId) {
  return `LIB-${bookId}`; // Simple barcode format
}

document.getElementById('scanBarcodeBtn').addEventListener('click', () => {
  const scannedBarcode = prompt("Scan or enter the barcode:");
  const book = books.find(b => generateBarcode(b.id) === scannedBarcode);
  if (!book) {
    alert("Invalid barcode.");
    return;
  }
  alert(`Book found: ${book.title}`);
});

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Show or hide the button based on scroll position
window.addEventListener('scroll', () => {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrollToTopBtn.style.display = 'block';
  } else {
    scrollToTopBtn.style.display = 'none';
  }
});

// Scroll to top when the button is clicked
scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Analytics Chart
const ctx = document.getElementById('analyticsChart').getContext('2d');
let analyticsChart;

function updateAnalyticsChart() {
  const totalBooks = books.length;
  const totalStudents = students.length;
  const borrowedBooksCount = borrowedBooks.filter(b => !b.returnDate).length;

  // Calculate overdue books
  const today = new Date();
  const overdueBooksCount = borrowedBooks.filter(item => {
    const dueDate = new Date(item.dueDate);
    return today > dueDate && !item.returnDate;
  }).length;

  // Destroy existing chart instance to avoid duplication
  if (analyticsChart) {
    analyticsChart.destroy();
  }

  // Create a new chart
  analyticsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total Books', 'Total Students', 'Borrowed Books', 'Overdue Books'],
      datasets: [{
        label: 'Library Statistics',
        data: [totalBooks, totalStudents, borrowedBooksCount, overdueBooksCount],
        backgroundColor: ['#36a2eb', '#ffcd56', '#4bc0c0', '#ff6384'], // Different colors for each category
        borderColor: ['#36a2eb', '#ffcd56', '#4bc0c0', '#ff6384'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1 // Ensure whole numbers on the Y-axis
          }
        }
      }
    }
  });
}

// Update Dashboard Summary and Analytics Chart
function updateDashboard() {
  const totalBooks = books.length;
  const totalStudents = students.length;
  const borrowedBooksCount = borrowedBooks.filter(b => !b.returnDate).length;

  // Calculate total fines
  let totalFines = 0;
  borrowedBooks.forEach(item => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    if (today > dueDate && !item.returnDate) {
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      totalFines += daysOverdue * fineRate;
    }
  });

  // Update dashboard stats
  document.getElementById('totalBooks').textContent = totalBooks;
  document.getElementById('totalStudents').textContent = totalStudents;
  document.getElementById('borrowedBooksCount').textContent = borrowedBooksCount;
  document.getElementById('totalFines').textContent = `$${totalFines}`;

  // Update the analytics chart
  updateAnalyticsChart();
}

// Backup and Restore
document.getElementById('exportDataBtn').addEventListener('click', () => {
  const data = JSON.stringify({ books, students, borrowedBooks, activityLog, reservations }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'library_data_backup.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importDataBtn').addEventListener('click', () => {
  const input = document.getElementById('importDataInput');
  input.click();
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        books = importedData.books || [];
        students = importedData.students || [];
        borrowedBooks = importedData.borrowedBooks || [];
        activityLog = importedData.activityLog || [];
        reservations = importedData.reservations || [];
        saveData();
        renderBooks();
        renderStudents();
        renderBorrowedBooks();
        renderActivityLog();
        updateDashboard();
        alert("Data successfully imported!");
      } catch (error) {
        alert("Invalid file format. Please upload a valid JSON file.");
      }
    };
    reader.readAsText(file);
  });
});

// Offline Mode
window.addEventListener('offline', () => {
  alert("You are offline. Changes will be saved locally.");
});

window.addEventListener('online', () => {
  alert("You are back online. Syncing data...");
  saveData(); // Sync data with the server
});

// Initial Render
renderBooks();
renderStudents();
renderBorrowedBooks();
renderActivityLog();
updateDashboard();