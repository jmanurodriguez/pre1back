import User from '../models/user.model.js';

class UserDAO {
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await User.findById(id).populate('cart');
    } catch (error) {
      throw new Error(`Error al buscar usuario por ID: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email }).populate('cart');
    } catch (error) {
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await User.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      ).populate('cart');
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, sort = {}, filter = {} } = options;
      
      return await User.paginate(filter, {
        page,
        limit,
        sort,
        populate: 'cart',
        lean: false
      });
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async updatePassword(id, hashedPassword) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }
  }

  async addResetToken(email, resetToken, resetExpires) {
    try {
      return await User.findOneAndUpdate(
        { email },
        { 
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires 
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al agregar token de reset: ${error.message}`);
    }
  }

  async findByResetToken(token) {
    try {
      return await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    } catch (error) {
      throw new Error(`Error al buscar por token de reset: ${error.message}`);
    }
  }

  async clearResetToken(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        {
          $unset: {
            resetPasswordToken: "",
            resetPasswordExpires: ""
          }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error al limpiar token de reset: ${error.message}`);
    }
  }
}

export default UserDAO;
