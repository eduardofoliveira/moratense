const loginReturnDTO = (user: any) => {
  return {
    id: user.id,
    id_empresa: user.id_empresa,
    nome: user.nome,
    email: user.email,
    tipo_conta: user.tipo_conta,
    ativo: user.ativo,
    removido: user.removido,
    status: user.status,
    token: "c498967a50d7b2587229403cd4ac58cf",
  }
}

export { loginReturnDTO }
