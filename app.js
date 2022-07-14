const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//and write APIs to perform operations on the table todo,

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoID = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};
  `;
  const todo = await db.get(getSpecificTodoID);
  response.send(todo);
});

//Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createQuery = `
    INSERT INTO 
      todo (id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');
  `;
  await db.run(createQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateQuery = null;
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateQuery = "Status";
      break;
    case requestBody.priority !== undefined:
      updateQuery = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateQuery = "Todo";
      break;
  }
  const previousTodo = `
    SELECT
     *
    FROM
     todo
    WHERE
     id = ${todoId};
  `;
  const todoD = await db.get(previousTodo);

  const {
    todo = todoD.todo,
    priority = todoD.priority,
    status = todoD.status,
  } = request.body;

  const updateQueryTodo = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};
  `;
  await db.run(updateQueryTodo);
  response.send(`${updateQuery} Updated`);
});

//Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
   DELETE FROM
    todo
   WHERE
    id = ${todoId};
  `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
