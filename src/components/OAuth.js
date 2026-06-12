import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "../style/OAuth.css";

const OAuth = ({ setAuthenticated }) => {

  async function handleSuccessfulLogin(response) {
    const token = response.credential;
    const profile = jwtDecode(token);

    localStorage.setItem("email", profile.email);
    localStorage.setItem("access_token", token);
    localStorage.setItem("authenticated","true");
    setAuthenticated("true");
  }

  return (
    <div className="OAuth">
      <GoogleLogin
        onSuccess={handleSuccessfulLogin}
        onError={() => console.log("error")}
        auto_select={true}
        text= "signin_with"
        shape= "rectangular"
        width="300px"
      />
    </div>
  );
};

export default OAuth;
