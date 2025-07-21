class UserDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.cart = user.cart;
    this.fullName = user.fullName || `${user.first_name} ${user.last_name}`;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static getCurrent(user) {
    return {
      id: user._id || user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      cart: user.cart,
      fullName: user.fullName || `${user.first_name} ${user.last_name}`
    };
  }

  static getAuthResponse(user) {
    return {
      id: user._id || user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      cart: user.cart
    };
  }

  static getListResponse(user) {
    return {
      id: user._id || user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      fullName: user.fullName || `${user.first_name} ${user.last_name}`
    };
  }

  static getPublicProfile(user) {
    return {
      id: user._id || user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      fullName: user.fullName || `${user.first_name} ${user.last_name}`
    };
  }
}

export default UserDTO;
