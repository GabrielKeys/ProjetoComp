// Error Middleware - Responsabilidade: Tratamento centralizado de erros
// Aplica SRP: Apenas tratamento de erros

const errorHandler = (error, req, res, next) => {
  console.error('Erro não tratado:', error);

  // Erros conhecidos
  if (error.message === 'Email já cadastrado' || 
      error.message === 'Credenciais inválidas' ||
      error.message === 'Dados incompletos') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error.message === 'Token inválido' || 
      error.message === 'Não autorizado') {
    return res.status(403).json({
      success: false,
      message: error.message
    });
  }

  if (error.message === 'Usuário não encontrado' ||
      error.message === 'Estação não encontrada' ||
      error.message === 'Veículo não encontrado' ||
      error.message === 'Reserva não encontrada') {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.DEBUG === 'true' && { 
      error: error.message,
      stack: error.stack 
    })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};


