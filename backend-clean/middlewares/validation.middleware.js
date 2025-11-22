// Validation Middleware - Responsabilidade: Validação de dados
// Aplica SRP: Apenas validação

const validateRegister = (req, res, next) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Dados incompletos. Campos obrigatórios: full_name, email, password'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Senha deve ter no mínimo 6 caracteres'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }

  next();
};

const validateVehicle = (req, res, next) => {
  const { model, year, plate, batteryCapacity, chargingPower } = req.body;

  if (!model || !year || !plate || !batteryCapacity || !chargingPower) {
    return res.status(400).json({
      success: false,
      message: 'Dados incompletos. Campos obrigatórios: model, year, plate, batteryCapacity, chargingPower'
    });
  }

  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return res.status(400).json({
      success: false,
      message: 'Ano inválido'
    });
  }

  next();
};

const validateReservation = (req, res, next) => {
  const { stationId, reservationDate, startTime, endTime } = req.body;

  if (!stationId || !reservationDate || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Dados incompletos. Campos obrigatórios: stationId, reservationDate, startTime, endTime'
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVehicle,
  validateReservation
};

