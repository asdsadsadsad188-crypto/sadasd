/**
 * UsernameGenerator - генерирует случайные usernames
 */
export class UsernameGenerator {
  /**
   * Генерирует случайный username длиной от 8 до 16 символов
   * @returns {string} Сгенерированный username
   */
  static generate() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 9) + 8; // 8-16 символов
    
    let username = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      username += chars[randomIndex];
    }
    
    return username;
  }

  /**
   * Проверяет валидность username
   * @param {string} username - Username для проверки
   * @returns {boolean} true если username валиден
   */
  static isValid(username) {
    if (typeof username !== 'string') {
      return false;
    }
    
    // Проверка длины (8-16 символов)
    if (username.length < 8 || username.length > 16) {
      return false;
    }
    
    // Проверка что содержит только буквы и цифры
    const alphanumericRegex = /^[A-Za-z0-9]+$/;
    return alphanumericRegex.test(username);
  }
}
