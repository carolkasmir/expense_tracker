document.addEventListener('DOMContentLoaded', async () => {
    // Handle Registration Form
    const registerForm = document.getElementById('registration-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const responseMessage = document.getElementById('response-message');

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                const result = await response.text();

                if (responseMessage) {
                    if (response.ok) {
                        responseMessage.textContent = 'Registration successful! Redirecting to login...';
                        setTimeout(() => {
                            window.location.href = './login.html'; // Redirect to login page
                        }, 2000); // Wait 2 seconds before redirect
                    } else {
                        responseMessage.textContent = `Registration failed: ${result}`;
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (responseMessage) {
                    responseMessage.textContent = 'An error occurred during registration.';
                }
            }
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const responseMessage = document.getElementById('response-message');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (responseMessage) {
                    if (response.ok) {
                        // Store userId in localStorage or sessionStorage
                        localStorage.setItem('userId', result.userId);
                        responseMessage.textContent = 'Login successful! Redirecting to dashboard...';
                        setTimeout(() => {
                            window.location.href = './dashboard.html'; // Redirect to dashboard page
                        }, 2000); // Wait 2 seconds before redirect
                    } else {
                        responseMessage.textContent = `Login failed: ${result.message}`;
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (responseMessage) {
                    responseMessage.textContent = 'An error occurred during login.';
                }
            }
        });
    }

    // Handle Add Expense Form
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const category = document.getElementById('category').value;
            const amount = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;
            const userId = localStorage.getItem('userId'); // Get user ID from storage
            const responseMessage = document.getElementById('response-message');

            try {
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: userId, category, amount, description, date }),
                });

                const result = await response.text();

                if (responseMessage) {
                    if (response.ok) {
                        responseMessage.textContent = 'Expense added successfully!';
                        setTimeout(() => {
                            window.location.href = './dashboard.html'; // Redirect to dashboard page
                        }, 2000); // Wait 2 seconds before redirect
                    } else {
                        responseMessage.textContent = `Error adding expense: ${result}`;
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (responseMessage) {
                    responseMessage.textContent = 'An error occurred while adding the expense.';
                }
            }
        });
    }

    // Handle Edit Expense Form
    const expenseId = new URLSearchParams(window.location.search).get('id');
    const editExpenseForm = document.getElementById('edit-expense-form');
    const responseMessage = document.getElementById('response-message');

    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const categories = await response.json();
                const categorySelect = document.getElementById('category');
                categorySelect.innerHTML = '<option value="">--Select a category--</option>' +
                    categories.map(category => `<option value="${category}">${category}</option>`).join('');
            } else {
                console.error('Error fetching categories:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function fetchExpenseDetails() {
        try {
            const response = await fetch(`/api/expenses/${expenseId}`);
            if (response.ok) {
                const expense = await response.json();

                document.getElementById('expense-id').value = expense.expense_id;
                document.getElementById('category').value = expense.category;
                document.getElementById('amount').value = expense.amount;
                document.getElementById('description').value = expense.description;
                document.getElementById('date').value = expense.date.split('T')[0]; // Convert timestamp to date

                await fetchCategories();
            } else {
                responseMessage.textContent = `Failed to fetch expense details: ${response.statusText}`;
            }
        } catch (error) {
            console.error('Error:', error);
            responseMessage.textContent = 'An error occurred while fetching the expense details.';
        }
    }

    if (editExpenseForm) {
        editExpenseForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const id = document.getElementById('expense-id').value;
            const category = document.getElementById('category').value;
            const amount = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;

            try {
                const response = await fetch(`/api/expenses/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ category, amount, description, date }),
                });

                if (response.ok) {
                    responseMessage.textContent = 'Expense updated successfully!';
                    setTimeout(() => {
                        window.location.href = './dashboard.html'; // Redirect to dashboard page
                    }, 2000); // Wait 2 seconds before redirect
                } else {
                    responseMessage.textContent = `Error updating expense: ${await response.text()}`;
                }
            } catch (error) {
                console.error('Error:', error);
                responseMessage.textContent = 'An error occurred while updating the expense.';
            }
        });
    }

    if (expenseId) {
        fetchExpenseDetails();
    }

    // Handle Delete Expense Action
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const id = event.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this expense?')) {
                try {
                    const response = await fetch(`/api/expenses/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        alert('Expense deleted successfully!');
                        window.location.reload(); // Reload the page to reflect changes
                    } else {
                        alert(`Failed to delete expense: ${await response.text()}`);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the expense.');
                }
            }
        }
    });

    // Apply Filters and Fetch Expenses
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const category = document.getElementById('category-dropdown').value;
            const date = document.getElementById('date-filter').value;
            fetchExpenses(category, date);
        });
    }

    async function fetchExpenses(category = '', date = '') {
        try {
            const userId = localStorage.getItem('userId'); // Get user ID from storage
            let url = `/api/expenses?user_id=${userId}`;
            if (category || date) {
                const params = new URLSearchParams();
                if (category) params.append('category', category);
                if (date) params.append('date', date);
                url += `&${params.toString()}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const expenses = await response.json();
                const tableBody = document.querySelector('#expenses-table tbody');
                tableBody.innerHTML = expenses.map(expense => `
                    <tr>
                        <td>${expense.category}</td>
                        <td>${expense.amount}</td>
                        <td>${expense.description}</td>
                        <td>${new Date(expense.date).toLocaleDateString()}</td>
                        <td>
                            <a href="edit-expense.html?id=${expense.expense_id}" class="edit-btn">Edit</a>
                            <button data-id="${expense.expense_id}" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                console.error('Error fetching expenses:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    if (document.getElementById('expenses-table')) {
        fetchExpenses();
    }

    // Load Categories on Add Expense Page
    if (document.getElementById('add-expense-form')) {
        await fetchCategories();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Handle Profile Update Form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const responseMessage = document.getElementById('profile-message');
            const userId = localStorage.getItem('userId'); // Get user ID from storage

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email }),
                });

                const result = await response.text();
                if (response.ok) {
                    responseMessage.textContent = 'Profile updated successfully!';
                } else {
                    responseMessage.textContent = `Error updating profile: ${result}`;
                }
            } catch (error) {
                console.error('Error:', error);
                responseMessage.textContent = 'An error occurred while updating the profile.';
            }
        });
    }

    // Handle Password Change Form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const responseMessage = document.getElementById('password-message');
            const userId = localStorage.getItem('userId'); // Get user ID from storage

            if (newPassword !== confirmPassword) {
                responseMessage.textContent = 'New passwords do not match.';
                return;
            }

            try {
                const response = await fetch(`/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ currentPassword, newPassword }),
                });

                const result = await response.text();
                if (response.ok) {
                    responseMessage.textContent = 'Password changed successfully!';
                } else {
                    responseMessage.textContent = `Error changing password: ${result}`;
                }
            } catch (error) {
                console.error('Error:', error);
                responseMessage.textContent = 'An error occurred while changing the password.';
            }
        });
    }
});

 // Function to fetch expense data for the chart
 async function fetchExpenseData() {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`/api/expenses?user_id=${userId}`);
    const expenses = await response.json();
    return expenses;
}

// Function to generate the chart
async function generateExpenseChart() {
    const expenses = await fetchExpenseData();

    // Process data for the chart
    const categories = [];
    const amounts = [];

    expenses.forEach(expense => {
        const index = categories.indexOf(expense.category);
        if (index === -1) {
            categories.push(expense.category);
            amounts.push(expense.amount);
        } else {
            amounts[index] += expense.amount;
        }
    });

    // Create the chart
    const ctx = document.getElementById('expenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar', // You can change this to 'pie', 'line', etc.
        data: {
            labels: categories,
            datasets: [{
                label: 'Expenses by Category',
                data: amounts,
                backgroundColor: [
                    '#FF5733', // Bright red
                    '#33FF57', // Bright green
                    '#3357FF', // Bright blue
                    '#FF33A6'  // Bright pink
                ],
                borderColor: [
                    '#FF5733',
                    '#33FF57',
                    '#3357FF',
                    '#FF33A6'
                ],
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        color: '#000000' // Black for x-axis labels
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0)' // Transparent grid lines for x-axis
                    }
                },
                y: {
                    ticks: {
                        color: '#000000' // Black for y-axis labels
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Generate the chart when the DOM is fully loaded
if (document.getElementById('expenseChart')) {
    generateExpenseChart();
}

 // Handle Logout
 const logoutBtn = document.getElementById('logout-btn');
 if (logoutBtn) {
     logoutBtn.addEventListener('click', () => {
         // Clear user session data (from localStorage)
         localStorage.removeItem('userId');

         // Redirect to login page after logout
         window.location.href = './login.html';
     });
 }

