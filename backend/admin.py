from django.contrib import admin
from .models import *

@admin.register(TableAnnee)
class AnneeAdmin(admin.ModelAdmin):
    list_display = ('annee_scolaire', 'debut', 'fin')
    search_fields = ('annee_scolaire',)

@admin.register(TableEleve)
class EleveAdmin(admin.ModelAdmin):
    # On affiche les infos clés et la photo
    list_display = ('matricule', 'fullname', 'sexe', 'date_naissance', 'dateajout')
    # On ajoute des filtres sur le côté
    list_filter = ('dateajout', 'sexe')
    # Barre de recherche
    search_fields = ('fullname', 'matricule')
    # Champs en lecture seule (générés par le code)
    readonly_fields = ('matricule', 'fullname', 'date_naissance', 'dateajout')

@admin.register(TableClasse)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ('code_classe', 'lib_classe', 'niveau_classe', 'option_classe')
    list_filter = ('niveau_classe', 'option_classe')
    search_fields = ('lib_classe', 'code_classe')

@admin.register(TableFraisScolarite)
class FraisAdmin(admin.ModelAdmin):
    list_display = ('annee_fs', 'classe_fs', 'frais_annuel')
    list_filter = ('annee_fs', 'classe_fs')

@admin.register(TableAffectation)
class AffectationAdmin(admin.ModelAdmin):
    list_display = ('eleve_aff', 'classe_aff', 'annee_aff', 'etat_aff')
    list_filter = ('annee_aff', 'classe_aff', 'etat_aff')
    search_fields = ('eleve_aff__fullname', 'eleve_aff__matricule')
    autocomplete_fields = ['eleve_aff', 'classe_aff', 'annee_aff']

@admin.register(TableRecouvrement)
class RecouvrementAdmin(admin.ModelAdmin):
    list_display = ('get_eleve', 'get_classe', 'total_paye', 'reduction')
    search_fields = ('eleve_aff__fullname', 'eleve_aff__matricule')
    autocomplete_fields = ['affectation']
    readonly_fields = ('frais_paiement', 'tranche1_paiement', 'tranche2_paiement', 'tranche3_paiement', 'total_paye')
    
    def get_eleve(self, obj):
        return obj.affectation.eleve_aff.fullname
    get_eleve.short_description = "Élève"

    def get_classe(self, obj):
        return obj.affectation.classe_aff.lib_classe
    get_classe.short_description = "Classe"

# Enregistrement simple pour les tables de base
admin.site.register(TableNiveau)
admin.site.register(TableOption)
admin.site.register(TableRole)
admin.site.register(TablePermission)
admin.site.register(TableUtilisateur)