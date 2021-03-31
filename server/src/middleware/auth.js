const { log } = require('../utils/logger')
const { forbidden } = require('@frenchpastries/millefeuille/response')
const jwt = require('jsonwebtoken')

const check = bearer =>
  new Promise((resolve, reject) => {
    log('check ', bearer)
    jwt.verify(
      bearer,
      process.env.AUTH0_PUBLIC_KEY,
      { algorithms: ['RS256'] },
      (err, decoded) => (err ? reject(err) : resolve(decoded))
    )
  })

const parseAuth = handler => request => {
  const { headers } = request
  const authorization = headers.authorization || ''
  if (authorization.startsWith('Bearer')) {
    return check(authorization.replace(/^Bearer\s+/, ''))
      .then(decoded => {
        const uid = decoded.sub.split('|')[1]
        return handler({ ...request, authorized: true, decoded, uid })
      })
      .catch(err => handler({ ...request, authorized: false }))
  } else {
    return handler({ ...request, authorized: false })
  }
}

const guardAuth = handler => async request => {
  if (request.authorized) {
    log('there')
    const result = await handler(request)
    log(result)
    return result
  } else {
    return forbidden('Unauthorized')
  }
}

module.exports = {
  parseAuth,
  guardAuth,
}
