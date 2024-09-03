const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcryptPassword = require('bcrypt')
const dbPath = path.join(__dirname, 'userData.db')
let dataBase = null

const initialzeDatabaseAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server at runnig at http://localhost:/3000...')
    })
  } catch (errror) {
    console.log(`DB ERROR: ${error.message}`)
    process.exit(1)
  }
}
initialzeDatabaseAndServer()

// API 1 Usesing the method POST ;
const validatePsssword = password => {
  return password.length < 5
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcryptPassword.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await dataBase.get(selectUserQuery)
  if (dbUser === undefined) {
    const postSqlQuery = `
    INSERT INTO
     user (username,name,password,gender,location)
    VALUES (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    );`
    if (validatePsssword(password)) {
      await dataBase.run(postSqlQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Passworis too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dataBaseUser = await dataBase.get(selectUserQuery)
  if (dataBaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatchhed = await bcryptPassword.compare(
      request.body.password,
      dataBaseUser.password,
    )
    if (isPasswordMatchhed === true) {
      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dataBaseUser = await dataBase.get(selectUserQuery)
  if (dataBaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatchhed = await bcryptPassword.compare(
      oldPassword,
      dataBaseUser.password,
    )
    if (isPasswordMatchhed === true) {
      if (validatePsssword(newPassword)) {
        const hashedPasswordUser = await bcryptPassword.hash(newPassword, 10)
        const updataPasswordQury = `
          UPDATE
            user
          SET password = '${hashedPasswordUser}'
            WHERE 
            username = '${username}';`
        const user = await dataBase.run(updataPasswordQury)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Passworis too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
