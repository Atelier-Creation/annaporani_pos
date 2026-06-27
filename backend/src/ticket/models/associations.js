// No FK constraints on tickets table — raised_by and assigned_to are plain UUIDs
// We do a manual join in the service using User.findByPk when needed
import Ticket from './ticket.model.js';
import Developer from './developer.model.js';

export { Ticket, Developer };
