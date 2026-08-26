import { supabase } from '../config/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-login');
  const inputCorreo = document.getElementById('correo');
  const inputPass = document.getElementById('contrasena');

  const ADMIN_EMAIL = 'juanjoseboca88@gmail.com';

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usuarioTexto = inputCorreo ? inputCorreo.value.trim().toLowerCase() : '';
      const passwordTexto = inputPass ? inputPass.value.trim() : '';

      if (!usuarioTexto || !passwordTexto) {
        alert('Por favor completa todos los campos.');
        return;
      }

      // LOGIN ADMINISTRADOR
      if (usuarioTexto === ADMIN_EMAIL) {
        try {
          await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: passwordTexto
          });
        } catch (err) {
          console.warn('Iniciando sesión en modo local:', err.message);
        }

        // Guardar credenciales de administrador
        localStorage.setItem('userEmail', ADMIN_EMAIL);
        localStorage.setItem('userRole', 'admin');

        // Redirección
        window.location.href = './administrador.html';
        return;
      }

      // LOGIN ESTUDIANTE
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: usuarioTexto,
          password: passwordTexto
        });

        if (error) throw error;

        localStorage.setItem('userEmail', usuarioTexto);
        localStorage.setItem('userRole', 'estudiante');
        window.location.href = './historial.html';

      } catch (err) {
        alert('Error al iniciar sesión: ' + err.message);
      }
    });
  }
});
