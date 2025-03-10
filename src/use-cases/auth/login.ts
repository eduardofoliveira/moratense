import User from "../../models/moratense/User"

type Params = {
  user: string
  password: string
}

const execute = async ({ user, password }: Params) => {
  return await User.checkAuth({ email: user, senha: password })
}

export default execute
