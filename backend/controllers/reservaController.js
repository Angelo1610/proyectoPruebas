const Reserva = require('../models/Reserva');

// Crear reserva
exports.crearReserva = async (req, res) => {
  try {
    const usuarioId = req.usuario.id; // 👈 tomado directamente del middleware
    const { servicioId, fecha, hora } = req.body;

    // Validación básica
    if (!servicioId || !fecha || !hora) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    const reserva = new Reserva({ usuarioId, servicioId, fecha, hora });
    await reserva.save();

    res.status(201).json({ mensaje: 'Reserva hecha', reserva });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear reserva', error: error.message });
  }
};

// Obtener reservas del usuario logueado
exports.obtenerMisReservas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const reservas = await Reserva.find({ usuarioId }).populate('servicioId');
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas', error: error.message });
  }
};

// Eliminar reserva
exports.eliminarReserva = async (req, res) => {
  try {
    const id = req.params.id;
    const reserva = await Reserva.findById(id);

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    // Solo el dueño de la reserva puede eliminarla
    if (reserva.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta reserva' });
    }

    await Reserva.findByIdAndDelete(id);
    res.json({ mensaje: 'Reserva eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar reserva', error: error.message });
  }
};
