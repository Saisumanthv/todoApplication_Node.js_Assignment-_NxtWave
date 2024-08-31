const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const {format, isValid} = require('date-fns')
app.use(express.json())
// const isValid = require('date-fns/isValid')

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const initiallizeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000)
    console.log('Server Running at http://localhost:3000/')
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initiallizeDBAndServer()

const checkInvalidScenarios = (request, response, next) => {
  const {status, priority, category, search_q = ''} = request.query
  const statusList = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityList = ['HIGH', 'MEDIUM', 'LOW']
  const categoryList = ['WORK', 'HOME', 'LEARNING']

  let valid = true
  if (status && !statusList.includes(status)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Status')
  }
  if (priority && !priorityList.includes(priority)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Priority')
  }
  if (category && !categoryList.includes(category)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Category')
  }

  request.search_q = search_q
  request.status = status
  request.priority = priority
  request.category = category

  if (valid) {
    next()
  }
}

app.get('/todos/', checkInvalidScenarios, async (request, response) => {
  const hasPriorityAndStatus = requestQueries => {
    return (
      requestQueries.priority !== undefined &&
      requestQueries.status !== undefined
    )
  }
  const hasCategoryAndStatus = requestQueries => {
    return (
      requestQueries.category !== undefined &&
      requestQueries.status !== undefined
    )
  }
  const hasCategoryAndPriority = requestQueries => {
    return (
      requestQueries.category !== undefined &&
      requestQueries.priority !== undefined
    )
  }
  const hasStatus = requestQueries => {
    return requestQueries.status !== undefined
  }
  const hasPriority = requestQueries => {
    return requestQueries.priority !== undefined
  }
  const hasCategory = requestQueries => {
    return requestQueries.category !== undefined
  }

  const {status, priority, category, search_q} = request

  let getTodoQuery
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}' AND todo LIKE '%${search_q}%';`
      break
    case hasCategoryAndStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}' AND todo LIKE '%${search_q}%';`
      break
    case hasCategoryAndPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}' AND todo LIKE '%${search_q}%';`
      break
    case hasStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%';`
      break
    case hasPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}%';`
      break
    case hasCategory(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND todo LIKE '%${search_q}%';`
      break
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
  }

  const todoArray = await db.all(getTodoQuery)
  const result = todoArray => {
    return {
      id: todoArray.id,
      todo: todoArray.todo,
      priority: todoArray.priority,
      status: todoArray.status,
      category: todoArray.category,
      dueDate: todoArray.due_date,
    }
  }
  response.send(todoArray.map(eachTodo => result(eachTodo)))
})

// API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const todoArray = await db.get(getTodoQuery)
  const result = todoArray => {
    return {
      id: todoArray.id,
      todo: todoArray.todo,
      priority: todoArray.priority,
      status: todoArray.status,
      category: todoArray.category,
      dueDate: todoArray.due_date,
    }
  }
  response.send(result(todoArray))
})

// API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isValid(new Date(date))) {
    const givenDate = format(new Date(date), 'yyyy-MM-dd')
    const getAgendaTodoQuery = `SELECT * FROM todo WHERE due_date = '${givenDate}';`
    console.log(getAgendaTodoQuery)
    const todoArray = await db.all(getAgendaTodoQuery)
    console.log(todoArray)
    const result = todoArray => {
      return {
        id: todoArray.id,
        todo: todoArray.todo,
        priority: todoArray.priority,
        status: todoArray.status,
        category: todoArray.category,
        dueDate: todoArray.due_date,
      }
    }
    response.send(todoArray.map(eachTodo => result(eachTodo)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API 4

const checkInvalidScenariosForPost = (request, response, next) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  const statusList = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityList = ['HIGH', 'MEDIUM', 'LOW']
  const categoryList = ['WORK', 'HOME', 'LEARNING']

  let valid = true
  if (status && !statusList.includes(status)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Status')
  }
  if (priority && !priorityList.includes(priority)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Priority')
  }
  if (category && !categoryList.includes(category)) {
    valid = false
    response.status(400)
    response.send('Invalid Todo Category')
  }
  if (dueDate && !categoryList.includes(category)) {
    valid = false
    response.status(400)
    response.send('Invalid Due Date')
  }
  if (isValid(new Date(dueDate))) {
  } else {
    valid = false
    response.status(400)
    response.send('Invalid Due Date')
  }

  request.id = id
  request.todo = todo
  request.category = category
  request.status = status
  request.priority = priority
  request.dueDate = dueDate

  if (valid) {
    next()
  }
}

app.post('/todos/', checkInvalidScenariosForPost, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const addTodoQuery = `INSERT INTO todo(id, todo, priority, status, category, due_date)
  VALUES('${id}','${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

const updateTodoQuery = (request, response, next) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body
  const statusList = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityList = ['HIGH', 'MEDIUM', 'LOW']
  const categoryList = ['WORK', 'HOME', 'LEARNING']

  let updateTodoQuery = null
  let message = null
  let valid = true
  if (todo !== undefined) {
    updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`
    message = 'Todo Updated'
  } else if (priority !== undefined) {
    if (priorityList.includes(priority)) {
      valid = true
      updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`
      message = 'Priority Updated'
    } else {
      valid = false
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (status !== undefined) {
    if (statusList.includes(status)) {
      valid = true
      updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`
      message = 'Status Updated'
    } else {
      valid = false
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (category !== undefined) {
    if (categoryList.includes(category)) {
      valid = true
      updateTodoQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`
      message = 'Category Updated'
    } else {
      valid = false
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    if (isValid(new Date(dueDate))) {
      valid = true
      const givenDate = format(new Date(dueDate), 'yyyy-MM-dd')
      updateTodoQuery = `UPDATE todo SET due_date = '${givenDate}' WHERE id = ${todoId};`
      message = 'Due Date Updated'
    } else {
      valid = false
      response.status(400)
      response.send('Invalid Due Date')
    }
  }

  request.updateTodoQuery = updateTodoQuery
  request.message = message
  if (valid) {
    next()
  }
}

// API 5
app.put('/todos/:todoId', updateTodoQuery, async (request, response) => {
  const {updateTodoQuery, message} = request
  await db.run(updateTodoQuery)
  response.send(message)
})

// API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
