import { themeFor } from "./games/registry";
import "./platform/ui/studio.css";
const parts = location.pathname.split("/").filter(Boolean);
const id = parts[0] === "games" ? parts[1] : parts[0];
const theme = themeFor(id);
const root = document.querySelector("#app")!;
const showError = (error: unknown) => {
  console.error(error);
  root.replaceChildren();
  const box = document.createElement("main");
  box.className = "load-error";
  const title = document.createElement("h1");
  title.textContent = "Your adventure could not load.";
  const message = document.createElement("p");
  message.textContent =
    error instanceof Error ? error.message : "Please try again.";
  const back = document.createElement("a");
  back.href = "/";
  back.textContent = "Return to the game collection";
  box.append(title, message, back);
  root.append(box);
};
if (theme)
  void import("./app/game")
    .then(({ mountGame }) => mountGame(theme))
    .catch(showError);
else if (!parts.length)
  void import("./app/lobby")
    .then(({ mountLobby }) => mountLobby())
    .catch(showError);
else showError(new Error("This game does not exist in the new collection."));
