import User from '../models/User.js';
import UserAvatar from '../models/UserAvatar.js';
import WatchedMovie from '../models/WatchedMovie.js';
import Group from '../models/Group.js';
import GroupImage from '../models/GroupImage.js';
import GroupActivity from '../models/GroupActivity.js';

// Borra un usuario y todos sus datos personales (lo usan "borrar mi cuenta" y el panel de admin)
export async function deleteUserAndData(userId) {
  // Sus notas en grupos se borran; las películas que añadió se quedan (aparecen como "antiguo miembro")
  await Group.updateMany({ 'movies.ratings.user': userId }, { $pull: { 'movies.$[].ratings': { user: userId } } });

  // Sale de sus grupos: si era el creador, el grupo pasa al siguiente; si se queda vacío, se borra
  for (const g of await Group.find({ members: userId })) {
    g.members = g.members.filter((m) => String(m) !== String(userId));
    if (g.members.length === 0) {
      await GroupImage.deleteOne({ group: g._id });
      await GroupActivity.deleteMany({ group: g._id });
      await g.deleteOne();
    } else {
      if (String(g.owner) === String(userId)) g.owner = g.members[0];
      await g.save();
    }
  }

  await Promise.all([
    WatchedMovie.deleteMany({ user: userId }),
    UserAvatar.deleteOne({ user: userId }),
    // Su rastro en los historiales de grupo también se borra
    GroupActivity.deleteMany({ $or: [{ user: userId }, { target: userId }] }),
  ]);
  await User.deleteOne({ _id: userId });
}
