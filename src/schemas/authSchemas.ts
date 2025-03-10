import { z } from "zod"

export const loginSchema = z.object({
  user: z
    .string({ message: "user é obrigatório e deve ser uma string" })
    .nonempty({ message: "user não pode ser vazio" }),
  password: z
    .string({ message: "password é obrigatório e deve ser uma string" })
    .nonempty({ message: "password não pode ser vazio" }),
})
