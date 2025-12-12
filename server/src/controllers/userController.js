import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { deleteOldProfilePicture } from '../middleware/upload.js';
import bcrypt from 'bcryptjs';

export async function getAllUsers(req, res) {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();

    // Remove sensitive information (password_hash)
    const safeUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }));

    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  try {
    // Validate role
    const validRoles = ['admin', 'manager', 'sales', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be one of: admin, manager, sales, viewer' 
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect main admin accounts from role changes
    const protectedEmails = ['nbulasio38@gmail.com', 'admin@apexelectricals.com'];
    if (protectedEmails.includes(user.email)) {
      return res.status(403).json({ 
        error: 'This is a protected system administrator account and cannot be modified' 
      });
    }

    // Prevent demoting the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await usersCollection.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot demote the last admin user' 
        });
      }
    }

    // Update user role
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { role } },
      { returnDocument: 'after' }
    );

    const updatedUser = result.value || result;

    res.json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        created_at: updatedUser.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect main admin accounts from deletion
    const protectedEmails = ['nbulasio38@gmail.com', 'admin@apexelectricals.com'];
    if (protectedEmails.includes(user.email)) {
      return res.status(403).json({ 
        error: 'This is a protected system administrator account and cannot be deleted' 
      });
    }

    // Prevent deleting yourself
    if (req.user.userId === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = await usersCollection.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Delete the user
    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if exists
    if (user.profile_picture) {
      deleteOldProfilePicture(user.profile_picture);
    }

    // Update user with new profile picture filename
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user.userId) },
      { $set: { profile_picture: req.file.filename, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    const updatedUser = result.value || result;

    res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture: updatedUser.profile_picture
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProfilePicture(req, res) {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete profile picture file if exists
    if (user.profile_picture) {
      deleteOldProfilePicture(user.profile_picture);
    }

    // Remove profile picture from database
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $unset: { profile_picture: '' }, $set: { updated_at: new Date() } }
    );

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getProfilePicture(req, res) {
  try {
    const { userId } = req.params;
    
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.profile_picture) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    res.json({ profile_picture: user.profile_picture });
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Admin function to change any user's password
export async function adminChangePassword(req, res) {
  const { userId } = req.params;
  const { newPassword } = req.body;

  try {
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if target user exists
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update the password
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password_hash,
          updated_at: new Date()
        } 
      }
    );

    res.json({ 
      message: `Password updated successfully for user: ${targetUser.username}`,
      username: targetUser.username
    });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: error.message });
  }
}

// User function to change their own password
export async function changeOwnPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From JWT token

  try {
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update the password
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password_hash,
          updated_at: new Date()
        } 
      }
    );

    res.json({ 
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change own password error:', error);
    res.status(500).json({ error: error.message });
  }
}
