import Cookies from 'js-cookie'

export const setAuthToken = (token) => {
  if (token) {
    Cookies.set('token', token, { expires: 7 }) // Token expires in 7 days
  } else {
    Cookies.remove('token')
  }
}

export const getAuthToken = () => {
  return Cookies.get('token')
}

export const removeAuthToken = () => {
  Cookies.remove('token')
}

export const isAuthenticated = () => {
  return !!getAuthToken()
} 