const fs = require('fs')

module.exports = {
  getHealth,
  getStudentProp,
  deleteStudentProp
}

async function getHealth (req, res, next) {
  res.json({ success: true })
}

async function getStudentProp (req, res, next) {
  const options = {
    // routes the findProp function to the appropriate handler
    operation: 'GET'
  }

  findProp(req,res,next,options)
}

async function deleteStudentProp (req, res, next) {
  // routes the findProp function to the appropriate handler
  const options = {
    operation: 'DELETE'
  }

  findProp(req,res,next,options)
}

// common code for functions requiring prop search
function findProp(req, res, next, options) {
  const studentId = req.params.studentId;
  // part of assignment to this const includes the operation to filter blanks
  const props = req.params[0].split('/').filter(prop => prop !== '')
  const path = `./data/${studentId}.json`

  // catch empty prop list (user error)
  if(props.length < 1) {
    next({
      statusCode: 400,
      message: "No Properties Requested"
    })
    return
  }

  // read file and handle result
  fs.readFile(path, (err, data) => {
    // handle errors
    if(err) {
      if(err.code === 'ENOENT') {
        let message = 'Unknown Student Requested'
        console.log(message);
        next({
          statusCode: 404,
          message
        })
        return
      }
      // non-404 errors
      console.log(err);
      next(err)
      return
    }

    // no errors
    else {
      // start current JSON level at top
      let original = JSON.parse(data)
      let current = original
      // index of prop list
      let prop = 0

      // for each prop but the last, if current object has it, set prop as new current and iterate
      while(prop < props.length - 1) {
        if(current[props[prop]]) {
          current = current[props[prop]]
          prop++
        }
        // catch unrecognized props
        else {
          next({
            statusCode: 404,
            message: 'Property Not Found'
          })
          return
        }
      }

      if(!current[props[prop]]) {
        next({
          statusCode: 404,
          message: 'Property Not Found'
        })
        return
      }

      switch(options.operation) {
        case 'GET':
          continueGetStudentProp(res, props[prop], current[props[prop]])
          break;
        case 'DELETE':
          continueDeleteStudentProp(res, original, path, current, props, prop)
          break;
        default:
            next({
              statusCode: 400
            })
          break;
      }
    }
  })
}

// once the target prop is found, send it up
function continueGetStudentProp(res, prop, value) {
  res.json({
    prop,
    value
  })
}

// once the target prop is found, delete it and report
function continueDeleteStudentProp(res, original, path, current, props, prop) {
  // once the final prop is found, delete it
  delete current[props[prop]]
  
  // write the resulting object with deletion to original file path
  fs.writeFile(path, JSON.stringify(original), (err) => {
    // handle write errors
    if(err) {
      next(err)
      return
    }

    res.json({
      deleted: props.join('/')
    })
  })
}