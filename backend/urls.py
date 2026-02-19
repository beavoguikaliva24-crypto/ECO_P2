from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'annees', AnneeViewSet)
router.register(r'niveaux', NiveauViewSet)
router.register(r'options', OptionViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'eleves', EleveViewSet)
router.register(r'classes', ClasseViewSet)
router.register(r'frais', FraisScolariteViewSet)
router.register(r'affectations', AffectationViewSet)
router.register(r'recouvrements', RecouvrementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]