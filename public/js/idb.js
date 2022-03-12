let db;

const request = indexedDB.open('new_budget', 1);

// this event will emit if the database version changes (nonexistent to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    if (navigator.onLine) {
      checkDatabase();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };
// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_budget'], 'readwrite');
  
    // access the object store for `new_budget`
    const budgetStore = transaction.objectStore('new_budget');
  
    // add record to your store with add method
    budgetStore.add(record);
  }

  function checkDatabase() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');
  
    // access your object store
    const budgetStore = transaction.objectStore('new_budget');
  
    // get all records from store and set to a variable
    const getAll = budgetStore.getAll();
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              const transaction = db.transaction(['new_budget'], 'readwrite');
              const budgetStore = transaction.objectStore('new_budget');
              budgetStore.clear();
    
              alert('All saved budgets have been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
      };
  
    // more to come...
  }

  window.addEventListener('online', checkDatabase);