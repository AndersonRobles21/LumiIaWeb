/**
 * almacenamiento.js
 * Módulo para la gestión segura de LocalStorage y SessionStorage.
 */

const CLAVES = {
  TAREAS: 'lumi_tareas',
  PERFIL: 'lumi_perfil',
  USUARIO: 'lumi_usuario'
};

export const almacenamiento = {
  /**
   * Obtiene y parsea un valor de LocalStorage
   */
  obtener(clave, valorPorDefecto = null) {
    try {
      const item = localStorage.getItem(clave);
      return item ? JSON.parse(item) : valorPorDefecto;
    } catch (error) {
      console.error(`Error al leer '${clave}' de LocalStorage:`, error);
      return valorPorDefecto;
    }
  },

  /**
   * Guarda un valor serializado en LocalStorage
   */
  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
      console.error(`Error al guardar '${clave}' en LocalStorage:`, error);
    }
  },

  /**
   * Elimina una clave de LocalStorage
   */
  eliminar(clave) {
    try {
      localStorage.removeItem(clave);
    } catch (error) {
      console.error(`Error al eliminar '${clave}' de LocalStorage:`, error);
    }
  },

  /**
   * Limpia toda la memoria local del sistema
   */
  limpiar() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar LocalStorage:', error);
    }
  }
};

export { CLAVES };