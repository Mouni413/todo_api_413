const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on the port 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDbServer();

// get todos

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let dbResponse = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
          select * from todo
          where todo like "%${search_q}%" and 
          priority ="${priority}" and
          status = "${status}";
          `;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
            select * from todo
            where 
            todo like "%${search_q}%" and
            priority = "${priority}";
            `;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
            select * from todo
            where 
            todo like "%${search_q}%" and
            status = "${status}";
            `;
      break;

    default:
      getTodosQuery = `
          select * from todo
          where todo like "%${search_q}%";
          `;
  }
  dbResponse = await db.all(getTodosQuery);
  response.send(dbResponse);
});

// get todo based on id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    select * from todo
    where
    id=${todoId};
    `;
  const dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});

// post todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    insert into todo (id,todo,priority,status)
    values
    (${id},'${todo}','${priority}','${status}');
    `;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// put todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedCoulm = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedCoulm = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedCoulm = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedCoulm = "Todo";
      break;
  }
  const previousTodoQuery = `
    select * from todo
    where id=${todoId};
    `;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    status = previousTodo.status,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
  } = request.body;
  const updateTodoQuery = `
  update todo
  set status='${status}',
  todo='${todo}',
  priority='${priority}'
  where id=${todoId};
  `;
  db.run(updateTodoQuery);
  response.send(`${updatedCoulm} Updated`);
});

// delete a todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete from todo
    where id=${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
