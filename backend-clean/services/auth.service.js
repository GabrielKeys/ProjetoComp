// Auth Service - Responsabilidade: Lógica de negócio de autenticação
// Aplica SRP: Apenas lógica de autenticação
// Aplica DIP: Depende de abstrações (repositories), não de implementações concretas

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const walletRepository = require('../repositories/wallet.repository');

class AuthService {
  async register(userData) {
    // Validação
    if (!userData.full_name || !userData.email || !userData.password) {
      throw new Error('Dados incompletos');
    }

    // Verificar se email já existe
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Criar usuário
    const user = await userRepository.create({
      full_name: userData.full_name,
      email: userData.email,
      password_hash: passwordHash,
      phone: userData.phone,
      is_google_user: false
    });

    // Criar carteira
    await walletRepository.create(user.id, 0.00);

    // Gerar token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone
      },
      token
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Buscar usuário
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone
      },
      token
    };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return user;
  }

  generateToken(userId, email) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'voltway-secret',
      { expiresIn: '7d' }
    );
  }

  async loginWithGoogle(googleData) {
    const { googleId, email, name, picture } = googleData;

    if (!googleId || !email) {
      throw new Error('Dados do Google incompletos');
    }

    // Buscar ou criar usuário
    let user = await userRepository.findByEmail(email);

    if (!user) {
      // Criar novo usuário Google
      user = await userRepository.create({
        full_name: name || 'Usuário Google',
        email,
        password_hash: null,
        phone: null,
        google_id: googleId,
        is_google_user: true,
        photo_url: picture || null
      });

      // Criar carteira
      await walletRepository.create(user.id, 0.00);
    } else {
      // Atualizar dados do Google se necessário
      if (!user.google_id) {
        const updated = await userRepository.update(user.id, {
          google_id: googleId,
          is_google_user: true,
          photo_url: picture || user.photo_url
        });
        if (updated) {
          user = updated;
        }
      }
    }

    // Gerar token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        photo_url: user.photo_url
      },
      token
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'voltway-secret');
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = new AuthService();


