import UserDAO from '../dao/user.dao.js';
import UserDTO from '../dto/user.dto.js';

class UserRepository {
  constructor() {
    this.userDAO = new UserDAO();
  }

  async createUser(userData) {
    try {
      const user = await this.userDAO.create(userData);
      return new UserDTO(user);
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const user = await this.userDAO.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return new UserDTO(user);
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await this.userDAO.findByEmail(email);
      if (!user) {
        return null;
      }
      return user; // Retornamos el modelo completo para autenticación
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      // Validar que no se envíen campos sensibles
      const allowedFields = ['first_name', 'last_name', 'age'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      const user = await this.userDAO.update(id, filteredData);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return new UserDTO(user);
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const user = await this.userDAO.delete(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(options = {}) {
    try {
      const result = await this.userDAO.findAll(options);
      
      return {
        users: result.docs.map(user => UserDTO.getListResponse(user)),
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          pagingCounter: result.pagingCounter,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(user) {
    try {
      return UserDTO.getCurrent(user);
    } catch (error) {
      throw error;
    }
  }

  async getAuthResponse(user) {
    try {
      return UserDTO.getAuthResponse(user);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id, hashedPassword) {
    try {
      const user = await this.userDAO.updatePassword(id, hashedPassword);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async addPasswordResetToken(email, resetToken, resetExpires) {
    try {
      const user = await this.userDAO.addResetToken(email, resetToken, resetExpires);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByResetToken(token) {
    try {
      const user = await this.userDAO.findByResetToken(token);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async clearPasswordResetToken(id) {
    try {
      const user = await this.userDAO.clearResetToken(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default UserRepository;
