from otree.api import Currency as c, currency_range
from . import pages
from ._builtin import Bot
from .models import Constants

import random

class PlayerBot(Bot):

    def play_round(self):
        correct = random.randint(1, 30)
        block_submission = {
            'block_correct': correct,
            'block_num_worked_on': correct + random.randint(0, 20),
            'block_avg_response_time': random.randint(500, 1500),
        }

        yield (pages.Block, block_submission)

        if self.subsession.kind == "control" or self.subsession.kind == "treatment":
            iti_reference = self.player.avg_response_time_by_kind_difficulty("training", self.player.block_difficulty)
            assert iti_reference != 0.0

        if self.subsession.show_ranking:
            yield (pages.Ranking)


        yield (pages.EndBlock)
