from otree.api import Currency as c, currency_range
from ._builtin import Page, WaitPage
from .models import Constants


class Block(Page):
    form_model = 'player'
    form_fields = ['block_correct', 'block_num_worked_on', 'block_avg_response_time']

    def get_timeout_seconds(self):
        return self.subsession.block_timeout_seconds


    def vars_for_template(self):
        iti_reference = 0.0
        if self.subsession.adjust_iti:
            iti_reference = self.player.avg_response_time_by_kind_difficulty('training', self.player.block_difficulty)
        
        return {
            'iti_reference': iti_reference
        }


class RankingWaitPage(WaitPage):
    def after_all_players_arrive(self):
        self.group.set_ranks()


class Ranking(Page):
    timeout_seconds = Constants.ranking_time_seconds

    def is_displayed(self):
        return self.subsession.show_ranking

    def vars_for_template(self):
        return {
            'performances': enumerate(reversed(sorted([p.block_correct for p in self.group.get_players()])), start=1),
            'own_performance': self.player.block_correct,
            'own_rank': self.player.block_rank,
        }


class BlockWaitPage(WaitPage):
    wait_for_all_groups = True


class EndBlock(Page):
    pass


page_sequence = [
    Block,
    RankingWaitPage,
    Ranking,
    BlockWaitPage,
    EndBlock,
]
