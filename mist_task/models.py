from otree.api import (
    models, widgets, BaseConstants, BaseSubsession, BaseGroup, BasePlayer,
    Currency as c, currency_range
)

import json
from random import shuffle

author = 'Christian König'

doc = """
Training
"""


class Constants(BaseConstants):
    name_in_url = 'mist_task'
    players_per_group = 2
    num_rounds = 15

    difficulties = [1, 2, 3, 4, 5]
    kinds = ['training', 'control', 'treatment']

    settings = {
        'training': {
            'adjust_iti': False,
            'enforce_time': False,
            'show_ranking': False,
            'block_timeout_seconds': 60,
        },
        'control': {
            'adjust_iti': True,
            'enforce_time': False,
            'show_ranking': False,
            'block_timeout_seconds': 120,
        },
        'treatment': {
            'adjust_iti': True,
            'enforce_time': True,
            'show_ranking': True,
            'block_timeout_seconds': 120,
        },
    }

    ranking_time_seconds = 20


class Subsession(BaseSubsession):
    kind = models.CharField(choices=Constants.kinds)
    enforce_time = models.BooleanField()
    adjust_iti = models.BooleanField()
    show_ranking = models.BooleanField()
    block_timeout_seconds = models.PositiveSmallIntegerField()


    def creating_session(self):
        if self.round_number <= 5:
            self.kind = 'training'
        elif self.round_number <= 10:
            self.kind = 'control'
        else:
            self.kind = 'treatment'

        self.enforce_time = Constants.settings[self.kind]['enforce_time']
        self.adjust_iti = Constants.settings[self.kind]['adjust_iti']
        self.show_ranking = Constants.settings[self.kind]['show_ranking']
        self.block_timeout_seconds = Constants.settings[self.kind]['block_timeout_seconds']
        
        for group in self.get_groups():
            if self.round_number == 1:
                # generate random orders on the group level
                training_order = Constants.difficulties.copy()
                control_order = Constants.difficulties.copy()
                treatment_order = Constants.difficulties.copy()

                # shufföe
                shuffle(training_order)
                shuffle(control_order)
                shuffle(treatment_order)

                # store on group level as json strings (cannot store lists directly)
                group.training_order = json.dumps(training_order)
                group.control_order = json.dumps(control_order)
                group.treatment_order = json.dumps(treatment_order)

            else:
                # take order from previous rounds
                group.training_order = group.in_round(1).training_order
                group.control_order = group.in_round(1).control_order
                group.treatment_order = group.in_round(1).treatment_order

                # decode from json to standard python list
                training_order = json.loads(group.training_order)
                control_order = json.loads(group.control_order)
                treatment_order = json.loads(group.treatment_order)


            # also assign to players 
            for player in group.get_players():
                if self.round_number <= 5:
                    player.block_difficulty = training_order[self.round_number - 1]
                elif self.round_number <= 10:
                    player.block_difficulty = control_order[self.round_number - 6]
                else:
                    player.block_difficulty = treatment_order[self.round_number - 11]


class Group(BaseGroup):
    training_order = models.CharField()
    control_order = models.CharField()
    treatment_order = models.CharField()

    def set_ranks(self):
        players_sorted_by_performance = list(reversed(sorted(self.get_players(), key=lambda player: player.block_correct)))
        print(players_sorted_by_performance)
        print([p.block_correct for p in players_sorted_by_performance])

        for player in self.get_players():
            player.block_rank = players_sorted_by_performance.index(player) + 1
            print(player.block_rank)



class Player(BasePlayer):
    block_difficulty = models.PositiveSmallIntegerField(doc="difficulty in block")
    block_correct    = models.PositiveSmallIntegerField(doc="correct in block", initial=0)
    block_num_worked_on = models.PositiveSmallIntegerField(doc="number of calculations worked on", initial=0)
    block_avg_response_time = models.FloatField(doc="avg response time in block", initial=0.0)
    block_rank = models.PositiveSmallIntegerField(initial=0)
    
    def avg_response_time_by_kind_difficulty(self, kind, difficulty):
        for past_player in self.in_all_rounds():
            if past_player.subsession.kind == kind:
                if past_player.block_difficulty == difficulty:
                    return past_player.block_avg_response_time 


