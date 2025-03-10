import { createHash } from "node:crypto"

import Db from "../../database/connectionManagerHomeLab"

export type IUser = {
  id: number
  id_empresa: number
  nome: string
  email: string
  senha: string
  tipo_conta: "administrador" | "empresa"
  ativo: boolean
  removido: boolean
  status: "ativo" | "inativo"
  created_at: Date
  updated_at: Date
}

export type IUserCreate = Omit<IUser, "id" | "created_at" | "updated_at">

export type IUserUpdate = Omit<IUser, "id" | "created_at">

const salt = "mor2s122"

const generateHash = (password: string): string => {
  const hash = createHash("sha256")
  hash.update(`${salt}${password}`)
  return hash.digest("hex")
}
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class User {
  static tableName = "users"

  public static async getAll(): Promise<IUser[]> {
    const db = Db.getConnection()
    return db(User.tableName).select("*")
  }

  public static async getById(id: number): Promise<IUser> {
    const db = Db.getConnection()
    return db(User.tableName).where({ id }).first()
  }

  public static async checkAuth({
    email,
    senha,
  }: { email: string; senha: string }): Promise<IUser> {
    const passwordHash = generateHash(senha)
    const db = Db.getConnection()
    return db(User.tableName).where({ email, senha: passwordHash }).first()
  }

  public static async create(logMix: IUserCreate): Promise<number> {
    const db = Db.getConnection()
    const [id] = await db(User.tableName).insert(logMix)
    return id
  }

  public static async update(id: number, logMix: IUserUpdate): Promise<void> {
    const db = Db.getConnection()
    await db(User.tableName).where({ id }).update(logMix)
  }

  public static async delete(id: string): Promise<void> {
    const db = Db.getConnection()
    await db(User.tableName).where({ id }).delete()
  }
}
