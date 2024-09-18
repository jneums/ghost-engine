export class MenuManager {
  private menuElement: HTMLElement;
  private gameElement: HTMLElement;

  constructor(menuElement: HTMLElement, gameElement: HTMLElement) {
    this.menuElement = menuElement;
    this.gameElement = gameElement;
  }

  public showMenu() {
    this.menuElement.style.display = 'flex';
    this.gameElement.style.display = 'none';
  }

  public hideMenu() {
    this.menuElement.style.display = 'none';
    this.gameElement.style.display = 'block';
  }

  public toggleMenu() {
    if (this.menuElement.style.display === 'none') {
      this.showMenu();
    } else {
      this.hideMenu();
    }
  }

  public isMenuVisible() {
    return this.menuElement.style.display === 'flex';
  }
}
