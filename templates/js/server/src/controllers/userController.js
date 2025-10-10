import User from "../models/userModel.js";

// User management controller - handles CRUD operations for users (admin only)

// Get paginated list of all users
export const getUsers = async (req, res, next) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Between 1-100 per page
    const skip = (page - 1) * limit;

    const filter = {}; // Could be extended for search/filtering

    // Fetch users and total count in parallel
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password") // Exclude password field
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single user by ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user information (admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, isAdmin } = req.body;

    // Only update provided fields
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isAdmin !== "undefined" && { isAdmin }),
      },
      { new: true, runValidators: true }, // Return updated doc and validate
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
