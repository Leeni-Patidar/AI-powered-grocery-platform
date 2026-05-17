import jwt from "jsonwebtoken";

const authSeller = async(req , res, next)=>{
    const { sellerToken, accessToken, token } = req.cookies;
    const userToken = accessToken || token;

    if(!sellerToken && !userToken){
        return res.json({success: false, message: "Not Authorized"});
    }


try {
    if (sellerToken) {
      const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
    
      if (tokenDecode.email === process.env.SELLER_EMAIL) {
        req.user = { email: tokenDecode.email, role: "admin" };
        next();
        return;
      }
    }

    if (userToken) {
      const tokenDecode = jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

      if (tokenDecode.role === "admin") {
        req.user = {
          id: tokenDecode.id,
          email: tokenDecode.email,
          role: tokenDecode.role,
        };
        next();
        return;
      }
    }

    return res.json({ success: false, message: 'Not Authorized' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

export default authSeller;
