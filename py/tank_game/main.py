import pygame
import sys

from config import *
from game_states import MenuState


def main() -> None:
    try:
        pygame.init()
        screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Tank Battle")
        clock = pygame.time.Clock()

        state = MenuState()
        running = True

        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                state = state.handle_event(event)

            state = state.update()
            state.draw(screen)
            pygame.display.flip()
            clock.tick(FPS)

    except pygame.error as e:
        print(f"Pygame error: {e}", file=sys.stderr)
    finally:
        pygame.quit()


if __name__ == "__main__":
    main()
