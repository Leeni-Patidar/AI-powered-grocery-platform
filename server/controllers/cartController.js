import  User from "../models/User.js"

//Update User CartData :/api/cart/update

export const updateCart = async (req, res) => {
  try {
    const { userId, cartItems } = req.body;
    if (!userId || !cartItems) return res.json({ success: false, message: "Missing fields" });
    await User.findByIdAndUpdate(userId, { cartItems });
    return res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
